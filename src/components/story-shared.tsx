import { Children, isValidElement, useEffect, useRef, useState, type ReactNode } from 'react';
import { Button } from './ui/button';
import type { DecisionCard } from '@/lib/signals';
import type { View } from '@/lib/signals';
import { questionHue } from '@/lib/signals';

export function StoryReveal({children,className = ''}: {children: ReactNode;className?: string}) {
  const ref=useRef<HTMLDivElement>(null);
  useEffect(()=>{const node=ref.current;if(!node)return;const observer=new IntersectionObserver(entries=>{if(entries.some(e=>e.isIntersecting)){node.dataset['revealed']='true';observer.disconnect();}},{threshold:0.08});observer.observe(node);return()=>observer.disconnect();},[]);
  return <div ref={ref} className={`story-reveal ${className}`}>{children}</div>;
}
export function evidenceItems(node: ReactNode): ReactNode[] { return isValidElement<{children?:ReactNode}>(node) ? Children.toArray(node.props.children) : Children.toArray(node); }
export function ExtraEvidence({sections,cards}: {sections:ReactNode;cards:DecisionCard[]}) {const used=new Set(cards.map(c=>c.evidence));if(used.has('alternatives'))used.add('category');return <div className="extra-evidence">{evidenceItems(sections).filter(node=>isValidElement<{id?:string}>(node)&&!used.has(node.props.id ?? ''))}</div>;}
export function LocalBar({name,cards,vendor=false,ancestry=true,view,onView}: {name:string;cards:DecisionCard[];vendor?:boolean;ancestry?:boolean;view:View;onView:(view:View)=>void}) {
  const [active,setActive]=useState('');
  const rail=useRef<HTMLElement>(null);
  useEffect(()=>{
    const element=rail.current;
    if(!element)return;
    const measure=()=>document.documentElement.style.setProperty('--record-rail-height',`${element.getBoundingClientRect().height}px`);
    measure();
    const observer=new ResizeObserver(measure);
    observer.observe(element);
    return()=>{observer.disconnect();document.documentElement.style.removeProperty('--record-rail-height');};
  },[]);
  useEffect(()=>{const ids=[...cards.map(c=>`chapter-${c.key}`),'all-questions',...(!vendor&&ancestry?['ancestry']:[])];const update=()=>{let next='';for(const id of ids){const node=document.getElementById(id);if(node&&node.getBoundingClientRect().top<=220)next=id;}setActive(next);};update();window.addEventListener('scroll',update,{passive:true});return()=>window.removeEventListener('scroll',update);},[cards,vendor,ancestry]);
  return <nav ref={rail} className="local-bar no-print" aria-label={`Chapters for ${name}`}><div className="local-bar-inner"><div className="rail-links">{cards.map((c,i)=><a className={`${questionHue(i)} ${active===`chapter-${c.key}`?'is-active':''}`} aria-current={active===`chapter-${c.key}`?'location':undefined} key={c.key} href={`#chapter-${c.key}`}>{c.short ?? c.question}</a>)}<a href="#all-questions" className={active==='all-questions'?'is-active':''}>All questions</a>{!vendor&&ancestry&&<a href="#ancestry" className={active==='ancestry'?'is-active':''}>Ancestry</a>}</div><Button variant="secondary" className="analyst-switch" role="switch" aria-checked={view==='analyst'} onClick={()=>onView(view==='analyst'?'brief':'analyst')}>Analyst detail</Button></div></nav>;
}
