function calcularPontuacao(state, caseData) {
  const g = caseData.gabarito;
  const breakdown = [];
  let total = 0;

  const suspeitoOk = state.suspect === g.culpado;
  if (suspeitoOk) {
    breakdown.push({ label: "Suspeito correto", pts: 35, status: "ok" });
    total += 35;
  } else {
    breakdown.push({ label: "Suspeito incorreto", pts: 0, status: "fail" });
  }

  const marcadas = [...state.marked];
  const acertos = marcadas.filter(id => g.chave.includes(id)).length;
  const evPts = Math.round((acertos / g.chave.length) * 40);
  const statusEv = acertos === g.chave.length ? "ok" : acertos > 0 ? "partial" : "fail";
  breakdown.push({ label: `Evidências-chave: ${acertos}/${g.chave.length}`, pts: evPts, status: statusEv });
  total += evPts;

  const traps = marcadas.filter(id => g.armadilhas.includes(id));
  if (traps.length > 0) {
    breakdown.push({ label: `Armadilhas marcadas: ${traps.length}`, pts: -traps.length * 8, status: "fail" });
    total -= traps.length * 8;
  }

  if (suspeitoOk && state.confidence >= 70) {
    breakdown.push({ label: "Confiança bem calibrada", pts: 10, status: "ok" });
    total += 10;
  } else if (!suspeitoOk && state.confidence >= 70) {
    breakdown.push({ label: "Excesso de confiança no erro", pts: -15, status: "fail" });
    total -= 15;
  } else if (suspeitoOk && state.confidence < 40) {
    breakdown.push({ label: "Acertou com pouca convicção", pts: 3, status: "partial" });
    total += 3;
  }

  const totalEv = caseData.evidencias.length;
  if (state.viewed.size >= totalEv - 2) {
    breakdown.push({ label: `Investigação completa (${state.viewed.size}/${totalEv} vistos)`, pts: 15, status: "ok" });
    total += 15;
  } else {
    breakdown.push({ label: `Investigação parcial (${state.viewed.size}/${totalEv} vistos)`, pts: 0, status: "partial" });
  }

  total = Math.max(0, Math.min(100, total));

  let rank;
  if (total >= 90)      rank = { nome: "Perito Digital",      cor: "#00ff9c" };
  else if (total >= 70) rank = { nome: "Analista Forense",    cor: "#00d4ff" };
  else if (total >= 50) rank = { nome: "Investigador Júnior", cor: "#ffc800" };
  else                  rank = { nome: "Aprendiz",            cor: "#ff4757" };

  const faltou = g.chave.filter(id => !marcadas.includes(id)).map(id => caseData.evidencias.find(e => e.id === id).nome);

  return { total, breakdown, rank, suspeitoOk, faltou, traps };
}
