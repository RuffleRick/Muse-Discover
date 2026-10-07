const form=document.getElementById('pairForm'),button=document.getElementById('pairButton'),status=document.getElementById('pairStatus');
form.onsubmit=async event=>{
 event.preventDefault();button.disabled=true;status.textContent='Connecting…';
 try{const response=await fetch('/pair',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({code:document.getElementById('code').value.trim()})});const result=await response.json();if(!response.ok)throw Error(result.error);location.reload();}
 catch(error){status.textContent=error.message;button.disabled=false;}
};
