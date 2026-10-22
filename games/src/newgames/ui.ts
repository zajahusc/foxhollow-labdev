export function el<T extends HTMLElement=HTMLElement>(tag:string,text='',cls=''):T{const node=document.createElement(tag) as T;node.textContent=text;if(cls)node.className=cls;return node;}
export function button(text:string,action:()=>void,cls='secondary'):HTMLButtonElement{const b=el<HTMLButtonElement>('button',text,cls);b.type='button';b.onclick=action;return b;}
export function link(text:string,href:string,cls=''):HTMLAnchorElement{const a=el<HTMLAnchorElement>('a',text,cls);a.href=href;return a;}
export function select(name:string,options:[string,string][],value:string,changed:(value:string)=>void):HTMLSelectElement{const s=el<HTMLSelectElement>('select');s.setAttribute('aria-label',name);for(const [value,text]of options){const o=el<HTMLOptionElement>('option',text);o.value=value;s.append(o);}s.value=value;s.onchange=()=>changed(s.value);return s;}
export function label(text:string,control:HTMLElement):HTMLLabelElement{const l=el<HTMLLabelElement>('label',text);l.append(control);return l;}
const dialog=document.getElementById('dialog') as HTMLDialogElement;
let origin:HTMLElement|null=null;
export function modal(title:string,nodes:Node[]){if(!dialog.open)origin=document.activeElement as HTMLElement;dialog.replaceChildren();const top=el('div','','dialog-head'),h=el('h2',title);h.id='modal-title';const close=button('×',()=>dialog.close(),'icon');close.setAttribute('aria-label','Close dialog');top.append(h,close);dialog.append(top,...nodes);dialog.setAttribute('aria-labelledby',h.id);if(!dialog.open)dialog.showModal();dialog.onclose=()=>origin?.focus();}
export function closeModal(){dialog.close();}
export function confirm(title:string,text:string,action:()=>void){const actions=el('div','','actions');actions.append(button('Cancel',closeModal),button('Confirm',()=>{closeModal();action();},'primary'));modal(title,[el('p',text),actions]);}
let timer:ReturnType<typeof setTimeout>|undefined;
export function notify(text:string){const toast=document.getElementById('toast')!;toast.textContent=text;toast.classList.add('show');clearTimeout(timer);timer=setTimeout(()=>toast.classList.remove('show'),5000);}
export async function copy(text:string){try{await navigator.clipboard.writeText(text);notify('Copied.');}catch{const area=el<HTMLTextAreaElement>('textarea');area.value=text;area.readOnly=true;area.rows=8;area.setAttribute('aria-label','Text to copy');modal('Copy this text.',[area]);area.select();}}
export async function share(text:string){if(navigator.share){try{await navigator.share({text});return;}catch(e){if(e instanceof Error&&e.name==='AbortError')return;}}await copy(text);}
