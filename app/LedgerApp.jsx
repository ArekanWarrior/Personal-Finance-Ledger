"use client";

import { useState, useEffect, useMemo } from "react";

const FONT_IMPORT_ID = "ledger-fonts";

const SEED_CATEGORIES = [
  { id: "c1", name: "Salary", type: "income" },
  { id: "c2", name: "Freelance", type: "income" },
  { id: "c3", name: "Rent", type: "fixed" },
  { id: "c4", name: "Utilities", type: "fixed" },
  { id: "c5", name: "Subscriptions", type: "fixed" },
  { id: "c6", name: "Groceries", type: "discretionary" },
  { id: "c7", name: "Dining Out", type: "discretionary" },
  { id: "c8", name: "Entertainment", type: "discretionary" },
  { id: "c9", name: "Transport", type: "discretionary" },
];

const SEED_BUDGETS = {
  "2026-08": { c3: 1500, c4: 150, c5: 30, c6: 350, c7: 120, c8: 100, c9: 80 },
};

const SEED_TRANSACTIONS = [
  { id: "t1", date: "2026-08-01", categoryId: "c1", amount: 4200, note: "Paycheck" },
  { id: "t2", date: "2026-08-01", categoryId: "c2", amount: 200, note: "Freelance gig" },
  { id: "t3", date: "2026-08-01", categoryId: "c3", amount: -1500, note: "Rent payment" },
  { id: "t4", date: "2026-08-03", categoryId: "c4", amount: -120.5, note: "Electric + water" },
  { id: "t5", date: "2026-08-05", categoryId: "c5", amount: -15.99, note: "Spotify" },
  { id: "t6", date: "2026-08-05", categoryId: "c5", amount: -12.99, note: "Netflix" },
  { id: "t7", date: "2026-08-06", categoryId: "c6", amount: -85.4, note: "Trader Joe's" },
  { id: "t8", date: "2026-08-08", categoryId: "c7", amount: -42.75, note: "Sushi dinner" },
  { id: "t9", date: "2026-08-12", categoryId: "c6", amount: -93.1, note: "Safeway" },
  { id: "t10", date: "2026-08-14", categoryId: "c8", amount: -30, note: "Movie tickets" },
  { id: "t11", date: "2026-08-15", categoryId: "c9", amount: -55, note: "Gas" },
  { id: "t12", date: "2026-08-18", categoryId: "c7", amount: -28.6, note: "Chipotle" },
  { id: "t13", date: "2026-08-20", categoryId: "c6", amount: -101.25, note: "Costco run" },
  { id: "t14", date: "2026-08-22", categoryId: "c8", amount: -60, note: "Concert tickets" },
];

const STORAGE_KEY = "ledger:data";

const fmt = (n) =>
  (n < 0 ? "-RM " : "RM ") + Math.abs(n).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const monthLabel = (m) => {
  const [y, mo] = m.split("-");
  return new Date(Number(y), Number(mo) - 1, 1).toLocaleDateString(undefined, { month: "long", year: "numeric" });
};

export default function LedgerApp() {
  const [categories] = useState(SEED_CATEGORIES);
  const [transactions, setTransactions] = useState(SEED_TRANSACTIONS);
  const [budgets, setBudgets] = useState(SEED_BUDGETS);
  const [selectedMonth, setSelectedMonth] = useState("2026-08");
  const [loaded, setLoaded] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState({ date: "", categoryId: "c6", amount: "", note: "", kind: "expense" });

  useEffect(() => {
    const inject = document.getElementById(FONT_IMPORT_ID);
    if (!inject) {
      const style = document.createElement("style");
      style.id = FONT_IMPORT_ID;
      style.textContent = `@import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600&family=IBM+Plex+Sans:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap');`;
      document.head.appendChild(style);
    }
  }, []);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const data = JSON.parse(raw);
        if (data.transactions) setTransactions(data.transactions);
        if (data.budgets) setBudgets(data.budgets);
        if (data.selectedMonth) setSelectedMonth(data.selectedMonth);
      }
    } catch (e) {
      // no saved data yet — seed data stands
    }
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    try {
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ transactions, budgets, selectedMonth })
      );
    } catch (e) {
      console.error("save failed", e);
    }
  }, [transactions, budgets, selectedMonth, loaded]);

  const catById = useMemo(() => Object.fromEntries(categories.map((c) => [c.id, c])), [categories]);

  const monthTx = useMemo(
    () => transactions.filter((t) => t.date.startsWith(selectedMonth)),
    [transactions, selectedMonth]
  );

  const availableMonths = useMemo(() => {
    const set = new Set(transactions.map((t) => t.date.slice(0, 7)));
    set.add(selectedMonth);
    return Array.from(set).sort();
  }, [transactions, selectedMonth]);

  const income = monthTx.filter((t) => t.amount > 0).reduce((s, t) => s + t.amount, 0);
  const expenses = monthTx.filter((t) => t.amount < 0).reduce((s, t) => s + t.amount, 0);
  const savingsRate = income > 0 ? ((income + expenses) / income) * 100 : 0;

  const spendByCategory = useMemo(() => {
    const map = {};
    monthTx.forEach((t) => {
      if (t.amount >= 0) return;
      map[t.categoryId] = (map[t.categoryId] || 0) + Math.abs(t.amount);
    });
    return categories
      .filter((c) => c.type !== "income")
      .map((c) => ({ ...c, spent: map[c.id] || 0, budget: (budgets[selectedMonth] || {})[c.id] || 0 }))
      .filter((c) => c.spent > 0 || c.budget > 0)
      .sort((a, b) => b.spent - a.spent);
  }, [monthTx, categories, budgets, selectedMonth]);

  const fixedTotal = spendByCategory.filter((c) => c.type === "fixed").reduce((s, c) => s + c.spent, 0);
  const discTotal = spendByCategory.filter((c) => c.type === "discretionary").reduce((s, c) => s + c.spent, 0);
  const splitTotal = fixedTotal + discTotal || 1;

  const shiftMonth = (dir) => {
    const idx = availableMonths.indexOf(selectedMonth);
    const next = idx + dir;
    if (next >= 0 && next < availableMonths.length) setSelectedMonth(availableMonths[next]);
  };

  const submitForm = (e) => {
    e.preventDefault();
    if (!form.date || !form.amount) return;
    const signed = form.kind === "income" ? Math.abs(Number(form.amount)) : -Math.abs(Number(form.amount));
    const newTx = {
      id: "t" + Date.now(),
      date: form.date,
      categoryId: form.categoryId,
      amount: signed,
      note: form.note || catById[form.categoryId]?.name || "",
    };
    setTransactions((prev) => [...prev, newTx]);
    setSelectedMonth(form.date.slice(0, 7));
    setForm({ date: "", categoryId: "c6", amount: "", note: "", kind: "expense" });
    setFormOpen(false);
  };

  return (
    <div style={styles.page}>
      <div style={styles.wrap}>
        <header style={styles.header}>
          <div>
            <div style={styles.kicker}>Personal ledger</div>
            <h1 style={styles.title}>Where it went</h1>
          </div>
          <div style={styles.monthNav}>
            <button style={styles.navBtn} onClick={() => shiftMonth(-1)} aria-label="Previous month">‹</button>
            <span style={styles.monthLabel}>{monthLabel(selectedMonth)}</span>
            <button style={styles.navBtn} onClick={() => shiftMonth(1)} aria-label="Next month">›</button>
          </div>
        </header>

        <section style={styles.heroRow}>
          <div style={styles.heroCard}>
            <div style={styles.heroLabel}>Savings rate</div>
            <div style={{ ...styles.heroNumber, color: savingsRate >= 0 ? "var(--green)" : "var(--red)" }}>
              {savingsRate.toFixed(0)}%
            </div>
            <div style={styles.heroSub}>
              {fmt(income)} in · {fmt(Math.abs(expenses))} out
            </div>
          </div>
          <div style={styles.splitCard}>
            <div style={styles.heroLabel}>Fixed vs discretionary</div>
            <div style={styles.splitBar}>
              <div style={{ ...styles.splitSeg, width: `${(fixedTotal / splitTotal) * 100}%`, background: "var(--ink)" }} />
              <div style={{ ...styles.splitSeg, width: `${(discTotal / splitTotal) * 100}%`, background: "var(--gold)" }} />
            </div>
            <div style={styles.splitLegend}>
              <span><i style={{ ...styles.dot, background: "var(--ink)" }} />Fixed {fmt(fixedTotal)}</span>
              <span><i style={{ ...styles.dot, background: "var(--gold)" }} />Discretionary {fmt(discTotal)}</span>
            </div>
          </div>
        </section>

        <section style={styles.panel}>
          <div style={styles.panelHeadRow}>
            <h2 style={styles.panelTitle}>Budget vs actual</h2>
          </div>
          <div style={styles.rule} />
          {spendByCategory.length === 0 && <p style={styles.empty}>No spending recorded yet for this month.</p>}
          {spendByCategory.map((c) => {
            const pct = c.budget > 0 ? (c.spent / c.budget) * 100 : 0;
            const over = c.budget > 0 && c.spent > c.budget;
            return (
              <div key={c.id} style={styles.budgetRow}>
                <div style={styles.budgetTop}>
                  <span style={styles.catName}>{c.name}</span>
                  <span style={styles.catAmounts}>
                    <span style={{ fontFamily: "'IBM Plex Mono', monospace" }}>{fmt(c.spent)}</span>
                    {c.budget > 0 && (
                      <span style={styles.ofBudget}> of {fmt(c.budget)}</span>
                    )}
                    {over && <span style={styles.stamp}>over</span>}
                  </span>
                </div>
                {c.budget > 0 && (
                  <div style={styles.barTrack}>
                    <div
                      style={{
                        ...styles.barFill,
                        width: `${Math.min(pct, 100)}%`,
                        background: over ? "var(--red)" : "var(--green)",
                      }}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </section>

        <button style={styles.addBtn} onClick={() => setFormOpen((v) => !v)}>
          {formOpen ? "Close" : "+ Add transaction"}
        </button>

        {formOpen && (
          <form style={styles.form} onSubmit={submitForm}>
            <div style={styles.formRow}>
              <label style={styles.label}>
                Type
                <select
                  style={styles.input}
                  value={form.kind}
                  onChange={(e) => setForm((f) => ({ ...f, kind: e.target.value, categoryId: e.target.value === "income" ? "c1" : "c6" }))}
                >
                  <option value="expense">Expense</option>
                  <option value="income">Income</option>
                </select>
              </label>
              <label style={styles.label}>
                Date
                <input style={styles.input} type="date" value={form.date} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))} required />
              </label>
            </div>
            <div style={styles.formRow}>
              <label style={styles.label}>
                Category
                <select style={styles.input} value={form.categoryId} onChange={(e) => setForm((f) => ({ ...f, categoryId: e.target.value }))}>
                  {categories
                    .filter((c) => (form.kind === "income" ? c.type === "income" : c.type !== "income"))
                    .map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                </select>
              </label>
              <label style={styles.label}>
                Amount
                <input style={styles.input} type="number" step="0.01" min="0" placeholder="0.00" value={form.amount} onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))} required />
              </label>
            </div>
            <label style={styles.label}>
              Note (optional)
              <input style={styles.input} type="text" placeholder="e.g. Coffee with Sam" value={form.note} onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))} />
            </label>
            <button type="submit" style={styles.saveBtn}>Save transaction</button>
          </form>
        )}

        <section style={styles.panel}>
          <div style={styles.panelHeadRow}>
            <h2 style={styles.panelTitle}>Transactions this month</h2>
          </div>
          <div style={styles.rule} />
          {monthTx.length === 0 && <p style={styles.empty}>Nothing recorded yet.</p>}
          {[...monthTx].sort((a, b) => (a.date < b.date ? 1 : -1)).map((t) => (
            <div key={t.id} style={styles.txRow}>
              <div>
                <div style={styles.txNote}>{t.note}</div>
                <div style={styles.txMeta}>{t.date} · {catById[t.categoryId]?.name}</div>
              </div>
              <div style={{ ...styles.txAmount, color: t.amount >= 0 ? "var(--green)" : "var(--ink)" }}>
                {fmt(t.amount)}
              </div>
            </div>
          ))}
        </section>
      </div>
      <style>{`
        :root {
          --paper: #EDEEE7;
          --surface: #F6F6F1;
          --ink: #1C2B2D;
          --ink-soft: #5B6B6B;
          --line: #CBCFC2;
          --gold: #B8863B;
          --red: #B14B3A;
          --green: #3F6B4F;
        }
        * { box-sizing: border-box; }
        button { cursor: pointer; font-family: inherit; }
        input, select { font-family: inherit; }
      `}</style>
    </div>
  );
}

const styles = {
  page: {
    background: "var(--paper)",
    minHeight: "100%",
    fontFamily: "'IBM Plex Sans', sans-serif",
    color: "var(--ink)",
    padding: "24px 16px 64px",
  },
  wrap: { maxWidth: 640, margin: "0 auto" },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-end",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 20,
  },
  kicker: { fontSize: 13, color: "var(--ink-soft)", marginBottom: 2 },
  title: {
    fontFamily: "'Fraunces', serif",
    fontWeight: 500,
    fontSize: 32,
    margin: 0,
    letterSpacing: "-0.01em",
  },
  monthNav: { display: "flex", alignItems: "center", gap: 10 },
  navBtn: {
    background: "none",
    border: "1px solid var(--line)",
    borderRadius: 4,
    width: 30,
    height: 30,
    fontSize: 16,
    color: "var(--ink)",
  },
  monthLabel: { fontSize: 14, minWidth: 130, textAlign: "center" },
  heroRow: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 },
  heroCard: {
    background: "var(--surface)",
    border: "1px solid var(--line)",
    borderRadius: 6,
    padding: "18px 16px",
  },
  heroLabel: { fontSize: 12.5, color: "var(--ink-soft)", marginBottom: 6 },
  heroNumber: { fontFamily: "'Fraunces', serif", fontSize: 40, fontWeight: 500, lineHeight: 1 },
  heroSub: { fontSize: 12.5, color: "var(--ink-soft)", marginTop: 8, fontFamily: "'IBM Plex Mono', monospace" },
  splitCard: {
    background: "var(--surface)",
    border: "1px solid var(--line)",
    borderRadius: 6,
    padding: "18px 16px",
  },
  splitBar: { display: "flex", height: 10, borderRadius: 3, overflow: "hidden", margin: "10px 0", background: "var(--line)" },
  splitSeg: { height: "100%" },
  splitLegend: { display: "flex", flexDirection: "column", gap: 4, fontSize: 12.5, fontFamily: "'IBM Plex Mono', monospace" },
  dot: { display: "inline-block", width: 8, height: 8, borderRadius: 2, marginRight: 6 },
  panel: {
    background: "var(--surface)",
    border: "1px solid var(--line)",
    borderRadius: 6,
    padding: "18px 16px",
    marginBottom: 16,
  },
  panelHeadRow: { display: "flex", justifyContent: "space-between", alignItems: "baseline" },
  panelTitle: { fontFamily: "'Fraunces', serif", fontWeight: 500, fontSize: 19, margin: 0 },
  rule: { height: 1, background: "var(--line)", margin: "10px 0 14px" },
  empty: { color: "var(--ink-soft)", fontSize: 13.5, margin: "4px 0" },
  budgetRow: { marginBottom: 14 },
  budgetTop: { display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 5, fontSize: 14 },
  catName: { fontWeight: 500 },
  catAmounts: { display: "flex", alignItems: "center", gap: 6, fontSize: 13 },
  ofBudget: { color: "var(--ink-soft)" },
  stamp: {
    fontSize: 10,
    letterSpacing: "0.05em",
    color: "var(--red)",
    border: "1px solid var(--red)",
    borderRadius: 3,
    padding: "1px 5px",
    marginLeft: 2,
  },
  barTrack: { height: 6, background: "var(--line)", borderRadius: 3, overflow: "hidden" },
  barFill: { height: "100%" },
  addBtn: {
    display: "block",
    width: "100%",
    background: "var(--ink)",
    color: "var(--paper)",
    border: "none",
    borderRadius: 6,
    padding: "12px 16px",
    fontSize: 14.5,
    fontWeight: 500,
    marginBottom: 16,
  },
  form: {
    background: "var(--surface)",
    border: "1px solid var(--line)",
    borderRadius: 6,
    padding: 16,
    marginBottom: 16,
    display: "flex",
    flexDirection: "column",
    gap: 12,
  },
  formRow: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 },
  label: { display: "flex", flexDirection: "column", fontSize: 12.5, color: "var(--ink-soft)", gap: 5 },
  input: {
    border: "1px solid var(--line)",
    borderRadius: 4,
    padding: "8px 10px",
    fontSize: 14,
    color: "var(--ink)",
    background: "#fff",
  },
  saveBtn: {
    background: "var(--green)",
    color: "#fff",
    border: "none",
    borderRadius: 6,
    padding: "10px 16px",
    fontSize: 14,
    fontWeight: 500,
  },
  txRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "9px 0",
    borderBottom: "1px solid var(--line)",
  },
  txNote: { fontSize: 14, fontWeight: 500 },
  txMeta: { fontSize: 12, color: "var(--ink-soft)", marginTop: 2 },
  txAmount: { fontFamily: "'IBM Plex Mono', monospace", fontSize: 14 },
};
