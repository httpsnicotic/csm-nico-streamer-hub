(function(){
  const DB_NAME='streamerHubLocalDB';
  const DB_VERSION=1;
  const STORE='kv';
  let dbPromise=null;

  function open(){
    if(dbPromise)return dbPromise;
    dbPromise=new Promise((resolve,reject)=>{
      if(!('indexedDB' in window)){reject(new Error('IndexedDB no está disponible en este navegador.'));return;}
      const req=indexedDB.open(DB_NAME,DB_VERSION);
      req.onupgradeneeded=()=>{const db=req.result;if(!db.objectStoreNames.contains(STORE))db.createObjectStore(STORE);};
      req.onsuccess=()=>resolve(req.result);
      req.onerror=()=>reject(req.error||new Error('No se pudo abrir el almacenamiento local.'));
    });
    return dbPromise;
  }
  async function run(mode,fn){
    const db=await open();
    return new Promise((resolve,reject)=>{
      const tx=db.transaction(STORE,mode),store=tx.objectStore(STORE);
      let req;
      try{req=fn(store);}catch(e){reject(e);return;}
      tx.onabort=()=>reject(tx.error||new Error('Operación local cancelada.'));
      tx.onerror=()=>reject(tx.error||new Error('Error de almacenamiento local.'));
      if(req){req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error||new Error('Error de almacenamiento local.'));}
      else tx.oncomplete=()=>resolve();
    });
  }
  const api={
    async get(key){return await run('readonly',s=>s.get(key));},
    async set(key,value){await run('readwrite',s=>s.put(value,key));return value;},
    async remove(key){await run('readwrite',s=>s.delete(key));},
    async migrateFromLocalStorage(key){
      const existing=await api.get(key); if(existing!=null)return existing;
      try{const raw=localStorage.getItem(key);if(!raw)return null;const value=JSON.parse(raw);await api.set(key,value);localStorage.removeItem(key);return value;}catch{return null;}
    }
  };
  window.LocalConfigDB=api;
})();
