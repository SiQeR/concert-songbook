(function(){
  const chordPattern = /\[([A-G][#b]?(?:m|maj|min|sus|dim|aug|add|\d|\+|\-|\/|[A-G#b])*)\]/g;
  const cuePattern = /^\s*(?:\{)?(?:Вступление|Проигрыш|Соло|Кода|Концовка|Бридж|Intro|Break|Outro|Bridge)(?:\s*\([^)]*\))?(?:\})?\s*:/i;
  const sectionPattern = /^\s*(?:\{)?(?:Куплет|Припев|Предприпев|Пред-припев|Постприпев|Verse|Chorus)(?:\s*\d+)?(?:\s*\([^)]*\))?(?:\})?\s*:?\s*$/i;
  function renderChart(chart, transpose, esc, tr){
    let number=0;
    const chord=c=>`<button type="button" class="chord" data-chord="${number++}" title="Нажмите, чтобы изменить аккорд">${esc(tr(c,transpose))}</button>`;
    const tokens=line=>[...line.matchAll(chordPattern)].map(m=>({start:m.index,end:m.index+m[0].length,chord:m[1]}));
    const isChordOnly=line=>{const t=tokens(line);return t.length>0&&!line.replace(chordPattern,'').trim()};
    const plain=line=>esc(line).replace(chordPattern,(_,c)=>chord(c));
    function segments(lyrics, found, positions){
      positions=positions.map(position=>{
        let p=Math.max(0,Math.min(position,lyrics.length));
        if(p<lyrics.length&&p>0&&!/\s/.test(lyrics[p])&&!/\s/.test(lyrics[p-1])){
          while(p>0&&!/\s/.test(lyrics[p-1]))p--;
        }
        return p;
      });
      let html='<div class="chart-pair">';
      if(positions[0]>0)html+=`<span class="chart-segment"><span class="chart-above">&nbsp;</span><span class="chart-lyric">${esc(lyrics.slice(0,positions[0]))}</span></span>`;
      for(let k=0;k<found.length;k++){
        const start=Math.min(positions[k],lyrics.length),end=k+1<found.length?Math.min(positions[k+1],lyrics.length):lyrics.length;
        const part=lyrics.slice(start,end);
        html+=`<span class="chart-segment"><span class="chart-above">${chord(found[k].chord)}</span><span class="chart-lyric">${part?esc(part):'&nbsp;'}</span></span>`;
      }
      return html+'</div>';
    }
    function pair(chordLine,lyricLine){
      const found=tokens(chordLine),positions=[];let offset=0;
      for(const t of found){positions.push(t.start-offset);offset+=t.end-t.start-t.chord.length}
      return segments(lyricLine,found,positions);
    }
    function inline(line){
      const found=tokens(line),positions=[];let offset=0;
      for(const t of found){positions.push(t.start-offset);offset+=t.end-t.start}
      return segments(line.replace(chordPattern,''),found,positions);
    }
    const lines=chart.replace(/\r\n?/g,'\n').split('\n'),out=[];
    for(let i=0;i<lines.length;i++){
      const line=lines[i],next=lines[i+1];
      if(!line.trim()){out.push('<div class="chart-blank"></div>');continue}
      if(line.trim().startsWith('!')){out.push(`<div class="chart-comment">${esc(line.trim().slice(1))}</div>`);continue}
      if(cuePattern.test(line)){out.push(`<div class="chart-cue">${plain(line)}</div>`);continue}
      if(sectionPattern.test(line)){out.push(`<div class="chart-section">${esc(line.trim())}</div>`);continue}
      if(next!==undefined&&isChordOnly(line)&&next.trim()&&!tokens(next).length&&!/^[eBGDAE]\|/.test(next.trim())){out.push(pair(line,next));i++;continue}
      if(tokens(line).length&&line.replace(chordPattern,'').match(/[А-Яа-яЁё]/)){out.push(inline(line));continue}
      out.push(`<div class="chart-plain">${plain(line)}</div>`);
    }
    return out.join('');
  }
  window.renderChart=renderChart;
})();
