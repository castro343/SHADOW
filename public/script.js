'use strict';
const toggle=document.getElementById('menuToggle');
const nav=document.getElementById('navigation');
if(toggle&&nav){
  toggle.addEventListener('click',()=>{
    const opened=nav.classList.toggle('open');
    toggle.setAttribute('aria-expanded',String(opened));
  });
  nav.querySelectorAll('a').forEach(link=>link.addEventListener('click',()=>{
    nav.classList.remove('open');
    toggle.setAttribute('aria-expanded','false');
  }));
}
const year=document.getElementById('year');
if(year) year.textContent=String(new Date().getFullYear());