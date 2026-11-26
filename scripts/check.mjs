import fs from 'node:fs';
import crypto from 'node:crypto';
import dns from 'node:dns';
import assert from 'node:assert/strict';
import {abi} from 'genlayer-js';
import {toHex, toRlp} from 'viem';
dns.setDefaultResultOrder('ipv4first');
export const sha=x=>crypto.createHash('sha256').update(x).digest('hex');
export async function rpc(method,params){
 if(!['eth_chainId','eth_getBalance','eth_getTransactionByHash','eth_getTransactionReceipt','gen_getContractCode','eth_getTransactionCount','sim_getFeeConfig','gen_call'].includes(method))throw Error('Read-only RPC methods only');
 if(method==='gen_call'&&(params.length!==1||params[0]?.type!=='read'))throw Error('Only read-mode gen_call permitted');
 for(let attempt=0;attempt<7;attempt++)try{
  const r=await fetch('https://studio.genlayer.com/api',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({jsonrpc:'2.0',id:1,method,params}),signal:AbortSignal.timeout(20000)});
  if(!r.ok)throw Error('HTTP failure');const p=await r.json();
  if(p.error?.code===-32000&&p.error?.message==='execution failed'){
   const e=Error('Contract read reverted');e.code=-32000;e.details='execution failed';throw e;
  }
  if (method === 'gen_call' && p.error?.code === -32603 && /^RLP /.test(p.error.message)) {
   const error = Error(p.error.message);
   error.code = 'STUDIO_RLP';
   throw error;
  }
  if(p.error||p.result==null)throw Error('RPC failure');return p.result;
 }catch(e){if(e.code==='STUDIO_RLP'||(e.code===-32000&&e.details==='execution failed'))throw e;
  if(attempt===6)throw Error('Read-only RPC unavailable: '+method);await new Promise(r=>setTimeout(r,Math.min(8000,2000*(attempt+1))));}
}
export function jsonSafe(x){
 if(typeof x==='bigint'){if(x>BigInt(Number.MAX_SAFE_INTEGER)||x<BigInt(Number.MIN_SAFE_INTEGER))throw Error('Unsafe decoded integer');return Number(x);}
 if(x instanceof Map)return Object.fromEntries([...x].map(([k,v])=>[k,jsonSafe(v)]));
 if(Array.isArray(x))return x.map(jsonSafe);
 if(x&&typeof x==='object')return Object.fromEntries(Object.entries(x).map(([k,v])=>[k,jsonSafe(v)]));return x;
}
export async function read(address,functionName,args){
 const encoded = toHex(abi.calldata.encode(abi.calldata.makeCalldataObject(functionName, args, {})));
 const call = {type:'read', to:address, from:'0x'+'0'.repeat(40), transaction_hash_variant:'latest-nonfinal'};
 let result;
 try {
   result = await rpc('gen_call', [{...call, data: encoded}]);
 } catch (error) {
   if (error.code !== 'STUDIO_RLP') throw error;
   // The Studio parser can mistake raw calldata for RLP. Retry with the SDK read envelope.
   result = await rpc('gen_call', [{...call, data: toRlp([encoded, toHex(false)])}]);
 }
 if(typeof result!=='string'||!/^(?:0x)?[0-9a-fA-F]*$/.test(result))throw Error('Unexpected read response');
 return jsonSafe(abi.calldata.decode(Uint8Array.from(Buffer.from(result.replace(/^0x/,''),'hex'))));
}
export async function receipt(hash) {
  let tx = await rpc('eth_getTransactionByHash', [hash]);
  const executions = value => value.consensus_data?.leader_receipt ?? [];
  const indexed = value => value.status === 'FINALIZED' && value.result_name &&
    executions(value).some(item => item.mode === 'leader' && item.execution_result);
  for (let attempt = 0; !indexed(tx) && attempt < 75; attempt++) {
    await new Promise(resolve => setTimeout(resolve, 5000));
    tx = await rpc('eth_getTransactionByHash', [hash]);
  }
  const leader = executions(tx).find(item => item.mode === 'leader');
  const votes = Object.values(tx.consensus_data?.votes ?? {});
  const summary = {
    hash, address: tx.to_address ?? tx.to, status: tx.status,
    execution: leader?.execution_result, consensus: tx.result_name,
    leader_only: tx.leader_only, initial_validators: tx.num_of_initial_validators,
    agree_votes: votes.filter(vote => vote === 'agree').length,
    validator_execution_seen: executions(tx).some(item => item.mode === 'validator'),
  };
  return {summary, tx, leader};
}
export async function source(address){
 const norm=x=>x.replace(/\r\n/g,'\n').trimEnd()+'\n';
 const actual=norm(Buffer.from(await rpc('gen_getContractCode',[address]),'base64').toString('utf8'));
 if(actual!==norm(fs.readFileSync('contracts/SequenceMotifIndex.py','utf8')))throw Error('Source mismatch');
 return {address,source_match:true,sha256:sha(actual)};
}
