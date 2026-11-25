import { Children, isValidElement, useEffect, useRef, useState, type ReactNode } from 'react';
import { ChevronDown } from 'lucide-react';
import type { DecisionCard, View } from '@/lib/signals';
import { Term } from './op-controls';

export function StoryReveal({children,className = ''}: {children: ReactNode;className?: string}) {
  const ref=useRef<HTMLDivElement>(null);
  useEffect(()=>{const node=ref.current;if(!node)return;const observer=new IntersectionObserver(entries=>{if(entries.some(e=>e.isIntersecting)){node.dataset['revealed']='true';observer.disconnect();}},{threshold:0.08});observer.observe(node);return()=>observer.disconnect();},[]);
  return <div ref={ref} className={`story-reveal ${className}`}>{children}</div>;
}
export function evidenceItems(node: ReactNode): ReactNode[] { return isValidElement<{children?:ReactNode}>(node) ? Children.toArray(node.props.children) : Children.toArray(node); }
export function ExtraEvidence({sections,cards}: {sections:ReactNode;cards:DecisionCard[]}) {const used=new Set(cards.map(c=>c.evidence));if(used.has('alternatives'))used.add('category');return <div className="extra-evidence">{evidenceItems(sections).filter(node=>isValidElement<{id?:string}>(node)&&!used.has(node.props.id ?? ''))}</div>;}

function railLabel(card: DecisionCard): ReactNode {
  if (card.evidence === 'research') return 'Studies';
  if (card.evidence === 'supplier') return 'Suppliers';
  if (card.evidence === 'procedures') return 'Medicare';
  if (card.evidence === 'addon') return 'Add-ons';
  if (card.evidence === 'predicates' && !card.short) return <Term term="Predicate">Predicate</Term>;
  return card.short ?? card.question;
}

export function chapterBeforeOffset(sections: { id: string; top: number }[], offset: number) {
  let next = '';
  for (const section of sections) if (section.top <= offset) next = section.id;
  return next;
}

export function LocalBar({name,cards,vendor=false,ancestry=true,view,onView,onOpen}: {name:string;cards:DecisionCard[];vendor?:boolean;ancestry?:boolean;view:View;onView:(view:View)=>void;onOpen?:(id:string)=>void}) {
  const [active,setActive]=useState('');
  const [fade,setFade]=useState(false);
  const rail=useRef<HTMLElement>(null);
  const links=useRef<HTMLDivElement>(null);
  const pending=useRef('');
  const pendingTimer=useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const mark=(id:string,evidence?:string)=>{pending.current=id;setActive(id);if(pendingTimer.current)clearTimeout(pendingTimer.current);pendingTimer.current=setTimeout(()=>{pending.current='';},1500);onOpen&&evidence&&onOpen(evidence);};
  useEffect(()=>{
    const element=rail.current,list=links.current;
    if(!element||!list)return;
    const measure=()=>{document.documentElement.style.setProperty('--record-rail-height',`${element.getBoundingClientRect().height}px`);setFade(list.scrollWidth>list.clientWidth+1&&list.scrollLeft+list.clientWidth<list.scrollWidth-2);};
    measure();
    const observer=new ResizeObserver(measure);
    observer.observe(element);observer.observe(list);
    list.addEventListener('scroll',measure,{passive:true});window.addEventListener('resize',measure);
    return()=>{observer.disconnect();list.removeEventListener('scroll',measure);window.removeEventListener('resize',measure);document.documentElement.style.removeProperty('--record-rail-height');};
  },[cards]);
  useEffect(()=>{
    const ids=[...cards.map(c=>`chapter-${c.key}`),'all-questions',...(!vendor&&ancestry?['ancestry']:[])];
    const update=()=>{
      const header=document.querySelector<HTMLElement>('.op-header')?.getBoundingClientRect().height??0;
      const railHeight=rail.current?.getBoundingClientRect().height??0;
      const offset=header+railHeight+12;
      if(pending.current){const target=document.getElementById(pending.current);if(target&&target.getBoundingClientRect().top>offset+2){setActive(pending.current);return;}pending.current='';}
      setActive(chapterBeforeOffset(ids.flatMap(id=>{const node=document.getElementById(id);return node?[{id,top:node.getBoundingClientRect().top}]:[];}),offset));
    };
    update();window.addEventListener('scroll',update,{passive:true});window.addEventListener('resize',update);
    return()=>{window.removeEventListener('scroll',update);window.removeEventListener('resize',update);if(pendingTimer.current)clearTimeout(pendingTimer.current);};
  },[cards,vendor,ancestry]);
  const railLink=(c:DecisionCard,extra='')=><a className={extra} aria-current={active===`chapter-${c.key}`?'location':undefined} key={`${extra}-${c.key}`} href={`#chapter-${c.key}`} onClick={()=>mark(`chapter-${c.key}`,c.evidence)}>{railLabel(c)}</a>;
  return <nav ref={rail} className="op-rail local-bar no-print" aria-label={`Chapters for ${name}`}><div className="op-wrap local-bar-inner"><div className={`rail-links-wrap${fade?' has-more':''}`}><div ref={links} className="rail-links">{cards.map(c=>railLink(c,c.evidence==='procedures'?'op-rail-medicare':c.evidence==='addon'?'op-rail-addon':''))}</div></div><details className="op-more"><summary>More<ChevronDown size={14} /></summary><div className="op-more-menu">{cards.filter(c=>c.evidence==='procedures'||c.evidence==='addon').map(c=>railLink(c,'op-more-rail-link'))}<a href="#all-questions" onClick={()=>mark('all-questions')} aria-current={active==='all-questions'?'location':undefined}>All questions</a>{!vendor&&ancestry&&<a href="#ancestry" onClick={()=>mark('ancestry')} aria-current={active==='ancestry'?'location':undefined}>Ancestry</a>}<button type="button" role="switch" aria-checked={view==='analyst'} onClick={()=>onView(view==='analyst'?'brief':'analyst')}>Analyst detail</button></div></details></div></nav>;
}
