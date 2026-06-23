import React, { useState, useEffect, useRef } from "react";
import { 
  Building2, 
  Search, 
  PenTool, 
  ShieldCheck, 
  Play, 
  RefreshCw, 
  AlertCircle, 
  CheckCircle2, 
  ChevronRight, 
  Lock, 
  Eye, 
  FileText, 
  Cpu, 
  Sparkles,
  Terminal,
  Layers,
  SearchCode,
  FileCheck2,
  Trash2,
  ExternalLink,
  Target,
  Clock,
  TrendingUp,
  Sliders,
  Database,
  Info
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import ReactMarkdown from "react-markdown";
import { 
  Log, 
  GrantMatchResult, 
  InvestigatorResult, 
  WriterResult, 
  ReviewerResult 
} from "./types";

// Setup preset templates matching backend matching keywords
const PRESETS = [
  {
    name: "Tutors for Tomorrow",
    mission: "We provide free after-school tutoring, math skills assistance, and digital learning tools for low-income K-12 students.",
    email: "director@tutorsfortomorrow.org",
    phone: "415-555-0192",
    ein: "45-1234567",
    category: "education",
    budgetRange: "$25k — $50k"
  },
  {
    name: "GreenEarth Youth Conservation",
    mission: "Our mission is community tree-planting, local eco-system sustainability projects, and nature awareness programs for children.",
    email: "contact@greenearthconservation.org",
    phone: "510-555-8392",
    ein: "94-9876543",
    category: "environment",
    budgetRange: "$75k — $100k"
  },
  {
    name: "Clara Adams Wellness",
    mission: "We operate local health clinics, provide basic medical checkups, and deliver wellness training programs targeting vulnerable communities.",
    email: "intake@claraadamshealth.org",
    phone: "650-555-4422",
    ein: "20-8329481",
    category: "health",
    budgetRange: "$45k — $100k"
  }
];

export default function App() {
  // Global App configuration and status
  const [geminiConfigured, setGeminiConfigured] = useState<boolean | null>(null);
  const [activeTab, setActiveTab] = useState<"coordinator" | "researcher" | "writer" | "reviewer">("coordinator");
  
  // Organization inputs
  const [orgName, setOrgName] = useState("Tutors for Tomorrow");
  const [mission, setMission] = useState("We provide free after-school tutoring, math skills assistance, and digital learning tools for low-income K-12 students.");
  const [email, setEmail] = useState("director@tutorsfortomorrow.org");
  const [phone, setPhone] = useState("415-555-0192");
  const [ein, setEin] = useState("45-1234567");

  // Telemetry Controls / Slider
  const [targetBudget, setTargetBudget] = useState(150); // in thousands
  const [successRateMock, setSuccessRateMock] = useState(142); // match count

  // Coordinator workflow state
  const [isRunningCoordinator, setIsRunningCoordinator] = useState(false);
  const [coordinatorResult, setCoordinatorResult] = useState<GrantMatchResult | null>(null);
  const [coordinatorLogs, setCoordinatorLogs] = useState<Log[]>([]);
  const [selectedResultSubTab, setSelectedResultSubTab] = useState<"grants" | "rawDraft" | "final">("final");
  const logsEndRef = useRef<HTMLDivElement>(null);

  // Playground individual test states
  // 1. Researcher Sandbox
  const [researcherQuery, setResearcherQuery] = useState("K-12 schools, learning technology, tutoring");
  const [isSearchingGrants, setIsSearchingGrants] = useState(false);
  const [researchResult, setResearchResult] = useState<InvestigatorResult | null>(null);
  
  // 2. Writer Sandbox
  const [writerProfile, setWriterProfile] = useState("Tutors for Tomorrow. Located in SF, providing K-12 math support. Contact: contact@tutors.org");
  const [writerGrantDetails, setWriterGrantDetails] = useState("EdTech Innovation Grant: $25,000 for non-profits providing digital learning tools.");
  const [isDraftingProposal, setIsDraftingProposal] = useState(false);
  const [writerResult, setWriterResult] = useState<WriterResult | null>(null);

  // 3. Reviewer Sandbox
  const [reviewerRawText, setReviewerRawText] = useState("Dear Global Education Fund, we are writing to apply for the after-school tutoring grant. Please reach out to our program director Sarah Jenkins at sjenkins@tutorsfortomorrow.org or via phone 415-555-0192 to discuss. Our Federal ID is 45-1234567. We look forward to your support.");
  const [isReviewingText, setIsReviewingText] = useState(false);
  const [reviewerResult, setReviewerResult] = useState<ReviewerResult | null>(null);

  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Check backend health and Gemini configuration status
  useEffect(() => {
    fetch("/api/health")
      .then((res) => res.json())
      .then((data) => {
        if (data.status === "ok") {
          setGeminiConfigured(data.geminiConfigured);
        }
      })
      .catch((err) => {
        console.error("Health check failed", err);
        setGeminiConfigured(false);
      });
  }, []);

  // Auto scroll logs window
  useEffect(() => {
    if (logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [coordinatorLogs]);

  const selectPreset = (preset: typeof PRESETS[0]) => {
    setOrgName(preset.name);
    setMission(preset.mission);
    setEmail(preset.email);
    setPhone(preset.phone);
    setEin(preset.ein);
    // synchronize search sandbox too to make exploration simple
    setResearcherQuery(preset.mission);
    setWriterProfile(`${preset.name}. Email: ${preset.email}, Phone: ${preset.phone}, Tax ID: ${preset.ein}`);
    setReviewerRawText(`Dear Grant Committee, we at ${preset.name} wish to apply for funding. You can contact us at our public office address or write to ${preset.email}. For verification, our phone lines are open at ${preset.phone} and our verified organization registration ID is ${preset.ein}.`);
  };

  // Run Coordinator Logic
  const handleRunCoordinator = async () => {
    setIsRunningCoordinator(true);
    setCoordinatorResult(null);
    setCoordinatorLogs([]);
    setErrorMessage(null);

    const fullProfile = `Organization: ${orgName}\nEmail: ${email}\nPhone: ${phone}\nEIN/TaxID: ${ein}\nMission Program Description: ${mission}`;

    try {
      const response = await fetch("/api/run-coordinator", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mission, profile: fullProfile }),
      });

      const result = await response.json();
      if (result.logs) {
        setCoordinatorLogs(result.logs);
      }

      if (response.ok && result.success) {
        setCoordinatorResult(result.data);
        setSelectedResultSubTab("final");
        setSuccessRateMock(prev => prev + 1);
      } else {
        setErrorMessage(result.error || "An unexpected error occurred during multi-agent orchestration.");
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to reach backend server. Please verify connections.");
    } finally {
      setIsRunningCoordinator(false);
    }
  };

  // Run Researcher Sandbox
  const handleRunResearcher = async () => {
    setIsSearchingGrants(true);
    setResearchResult(null);
    setErrorMessage(null);
    try {
      const response = await fetch("/api/run-researcher", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mission: researcherQuery }),
      });
      const data = await response.json();
      if (response.ok) {
        setResearchResult(data);
      } else {
        setErrorMessage(data.error || "Failed to run researcher sandbox.");
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Connection failure during research execution.");
    } finally {
      setIsSearchingGrants(false);
    }
  };

  // Run Writer Sandbox
  const handleRunWriter = async () => {
    setIsDraftingProposal(true);
    setWriterResult(null);
    setErrorMessage(null);
    try {
      const response = await fetch("/api/run-writer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profile: writerProfile, grantDetails: writerGrantDetails }),
      });
      const data = await response.json();
      if (response.ok) {
        setWriterResult(data);
      } else {
        setErrorMessage(data.error || "Failed to run writer sandbox.");
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Connection failure during proposal crafting.");
    } finally {
      setIsDraftingProposal(false);
    }
  };

  // Run Reviewer Sandbox
  const handleRunReviewer = async () => {
    setIsReviewingText(true);
    setReviewerResult(null);
    setErrorMessage(null);
    try {
      const response = await fetch("/api/run-reviewer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rawText: reviewerRawText }),
      });
      const data = await response.json();
      if (response.ok) {
        setReviewerResult(data);
      } else {
        setErrorMessage(data.error || "Failed to run reviewer sandbox.");
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Connection failure during security evaluation.");
    } finally {
      setIsReviewingText(false);
    }
  };

  const getLogColor = (type: string) => {
    switch (type) {
      case "tool": return "text-indigo-400 font-medium bg-neutral-800 border border-neutral-700 px-1.5 py-0.5 rounded";
      case "thought": return "text-amber-400 italic bg-neutral-800/60 border border-neutral-800 px-1.5 py-0.5 rounded";
      case "result": return "text-emerald-400 bg-neutral-900 border border-neutral-800 px-1.5 py-0.5 rounded font-mono text-[11px] leading-relaxed block whitespace-pre-wrap mt-1";
      default: return "text-neutral-300";
    }
  };

  const getAgentLabel = (agent: string) => {
    switch (agent) {
      case "grantmatch_coordinator":
        return <span className="bg-slate-700 text-slate-100 px-2 py-0.5 rounded-md text-[9px] font-mono tracking-tight uppercase">Coordinator</span>;
      case "researcher_agent":
        return <span className="bg-indigo-600 text-white px-2 py-0.5 rounded-md text-[9px] font-mono tracking-tight uppercase">Researcher</span>;
      case "writer_agent":
        return <span className="bg-amber-500 text-neutral-950 px-2 py-0.5 rounded-md text-[9px] font-mono tracking-tight uppercase">Writer</span>;
      case "reviewer_agent":
        return <span className="bg-rose-500 text-white px-2 py-0.5 rounded-md text-[9px] font-mono tracking-tight uppercase">Reviewer</span>;
      default:
        return <span className="bg-neutral-650 text-white px-2 py-0.5 rounded-md text-[9px] font-mono tracking-tight uppercase">{agent}</span>;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans p-4 md:p-6 lg:p-8 flex flex-col justify-start selection:bg-indigo-600 selection:text-white">
      
      {/* Header Section styled according to Bento theme */}
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 max-w-7xl w-full mx-auto">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-bold text-xl font-display shadow-indigo-200 shadow-md">
            G
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-slate-800 font-display">
              Grant Match <span className="text-indigo-600">Agent</span>
            </h1>
            <p className="text-xs text-slate-500 font-medium">ReAct Protocol Multi-Agent Intelligence System</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {geminiConfigured === true ? (
            <div className="px-3.5 py-1.5 bg-emerald-100 text-emerald-800 text-xs font-semibold rounded-full flex items-center gap-2 shadow-sm border border-emerald-200">
              <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse"></span>
              Agent Core Live: Active
            </div>
          ) : geminiConfigured === false ? (
            <div className="px-3.5 py-1.5 bg-amber-50 text-amber-800 text-xs font-semibold rounded-full flex items-center gap-2 border border-amber-200 shadow-sm">
              <span className="w-2.5 h-2.5 bg-amber-400 rounded-full"></span>
              Action Needed: Key Required
            </div>
          ) : (
            <div className="px-3 py-1 bg-slate-100 text-slate-600 text-xs rounded-full animate-pulse">
              Calibrating Nodes...
            </div>
          )}
          <div className="text-xs font-semibold px-3 py-1.5 bg-indigo-50 border border-indigo-100 text-indigo-700 rounded-full shadow-sm font-mono uppercase tracking-wider">
            A2A v0.5.0
          </div>
        </div>
      </header>

      {/* Bento Grid Main Container */}
      <main className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 auto-rows-auto gap-4 max-w-7xl w-full mx-auto flex-1">
        
        {/* ROW 1: Organization Presets | Workspace Selector | Profile Editor | Compliance Safeguards */}

        {/* Bento Cell 1: Non-Profit Profile Template Selector */}
        <div className="lg:col-span-3 bg-white rounded-3xl border border-slate-200 shadow-sm p-5 flex flex-col justify-between transition-all hover:shadow-md min-h-[280px]">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="p-1.5 bg-indigo-50 rounded-lg text-indigo-600">
                <Sparkles className="h-4 w-4" />
              </div>
              <h2 className="text-sm font-extrabold text-slate-900 font-display uppercase tracking-wider">Organization Presets</h2>
            </div>
            <p className="text-xs text-slate-500 mb-4 leading-relaxed">
              Select an archetype profile to prepulate the orchestrator workspace with mission keys and custom regulatory compliance parameters.
            </p>
            
            <div className="space-y-2.5">
              {PRESETS.map((preset, idx) => {
                const isActive = orgName === preset.name;
                return (
                  <button
                    key={idx}
                    onClick={() => selectPreset(preset)}
                    className={`w-full flex flex-col text-left p-3 rounded-2xl border transition-all ${
                      isActive 
                        ? "border-indigo-600 bg-indigo-50/20 shadow-sm" 
                        : "border-slate-100 hover:border-slate-200 hover:bg-slate-50/45"
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="text-xs font-bold text-slate-800 font-display flex items-center gap-1.5">
                        <Building2 className="h-3.5 w-3.5 text-slate-400" />
                        {preset.name}
                      </span>
                      <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded uppercase bg-indigo-50 text-indigo-700">
                        {preset.category}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1 line-clamp-1">
                      {preset.mission}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-5 pt-3.5 border-t border-slate-100 flex items-center justify-between bg-slate-50 -mx-6 -mb-6 p-4 rounded-b-3xl">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">Dataset Volume:</span>
            <span className="text-xs font-extrabold text-slate-700 font-mono">3 Fully Modeled Categories</span>
          </div>
        </div>

        {/* Bento Cell 2: Primary Sandbox and Flow Workspace Navigation */}
        <div className="lg:col-span-3 bg-white rounded-3xl border border-slate-200 shadow-sm p-5 flex flex-col justify-between transition-all hover:shadow-md min-h-[280px]">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="p-1.5 bg-indigo-50 rounded-lg text-indigo-600">
                <Sliders className="h-4 w-4" />
              </div>
              <h2 className="text-sm font-extrabold text-slate-900 font-display uppercase tracking-wider">Workspace Selector</h2>
            </div>
            <p className="text-xs text-slate-500 mb-4 leading-relaxed">
              Pivot between the full Automated ReAct Coordinator Timeline or execute individual agents in sandboxes to verify reasoning tools.
            </p>

            <div className="grid grid-cols-2 gap-2.5">
              <button
                onClick={() => setActiveTab("coordinator")}
                className={`py-3 px-3 rounded-2xl border text-left transition-all flex flex-col justify-between h-24 ${
                  activeTab === "coordinator" 
                    ? "border-indigo-600 bg-indigo-600 text-white shadow-md shadow-indigo-100" 
                    : "border-slate-100 hover:border-slate-200 bg-slate-50/50 hover:bg-slate-50 text-slate-800"
                }`}
              >
                <Layers className={`h-4 w-4 ${activeTab === "coordinator" ? "text-white" : "text-indigo-600"}`} />
                <div>
                  <p className="text-xs font-bold leading-normal">Coordinator Team</p>
                  <p className={`text-[9px] ${activeTab === "coordinator" ? "text-indigo-200" : "text-slate-400"}`}>End-to-End ReAct Flow</p>
                </div>
              </button>

              <button
                onClick={() => setActiveTab("researcher")}
                className={`py-3 px-3 rounded-2xl border text-left transition-all flex flex-col justify-between h-24 ${
                  activeTab === "researcher" 
                    ? "border-indigo-600 bg-indigo-600 text-white shadow-md shadow-indigo-100" 
                    : "border-slate-100 hover:border-slate-200 bg-slate-50/50 hover:bg-slate-50 text-slate-800"
                }`}
              >
                <SearchCode className={`h-4 w-4 ${activeTab === "researcher" ? "text-white" : "text-indigo-600"}`} />
                <div>
                  <p className="text-xs font-bold leading-normal">Researcher Agent</p>
                  <p className={`text-[9px] ${activeTab === "researcher" ? "text-indigo-200" : "text-slate-400"}`}>Heuristics Search Tool</p>
                </div>
              </button>

              <button
                onClick={() => setActiveTab("writer")}
                className={`py-3 px-3 rounded-2xl border text-left transition-all flex flex-col justify-between h-24 ${
                  activeTab === "writer" 
                    ? "border-indigo-600 bg-indigo-600 text-white shadow-md shadow-indigo-100" 
                    : "border-slate-100 hover:border-slate-200 bg-slate-50/50 hover:bg-slate-50 text-slate-800"
                }`}
              >
                <PenTool className={`h-4 w-4 ${activeTab === "writer" ? "text-white" : "text-indigo-600"}`} />
                <div>
                  <p className="text-xs font-bold leading-normal">Writer Agent</p>
                  <p className={`text-[9px] ${activeTab === "writer" ? "text-indigo-200" : "text-slate-400"}`}>Drafting Generator</p>
                </div>
              </button>

              <button
                onClick={() => setActiveTab("reviewer")}
                className={`py-3 px-3 rounded-2xl border text-left transition-all flex flex-col justify-between h-24 ${
                  activeTab === "reviewer" 
                    ? "border-indigo-600 bg-indigo-600 text-white shadow-md shadow-indigo-100" 
                    : "border-slate-100 hover:border-slate-200 bg-slate-50/50 hover:bg-slate-50 text-slate-800"
                }`}
              >
                <ShieldCheck className={`h-4 w-4 ${activeTab === "reviewer" ? "text-white" : "text-indigo-600"}`} />
                <div>
                  <p className="text-xs font-bold leading-normal">Reviewer Agent</p>
                  <p className={`text-[9px] ${activeTab === "reviewer" ? "text-indigo-200" : "text-slate-400"}`}>Compliance redact_pii</p>
                </div>
              </button>
            </div>
          </div>

          <div className="mt-4 pt-3.5 border-t border-slate-100 flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">Current Context:</span>
            <span className="text-xs font-extrabold text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-full font-mono uppercase">
              {activeTab} active
            </span>
          </div>
        </div>

        {/* Bento Cell 3: Organization Details Form (Profile Editor) */}
        <div className="lg:col-span-3 bg-white rounded-3xl border border-slate-200 shadow-sm p-5 flex flex-col justify-between transition-all hover:shadow-md min-h-[280px]">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-150 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-indigo-50 rounded-lg text-indigo-600">
                  <Building2 className="h-4 w-4" />
                </div>
                <h3 className="text-sm font-extrabold tracking-tight text-slate-800 font-display uppercase">Profile Editor</h3>
              </div>
              <button
                onClick={() => {
                  setOrgName("");
                  setMission("");
                  setEmail("");
                  setPhone("");
                  setEin("");
                }}
                className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-slate-50 transition-colors"
                title="Clear Workspace"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3.5">
              <div>
                <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-1">Organization Name</label>
                <input
                  type="text"
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  placeholder="e.g. Hope Literacy Centers"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 focus:outline-none transition-all placeholder:text-neutral-400 font-medium bg-slate-50/50"
                />
              </div>

              <div>
                <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-1">Mission Statement Keywords</label>
                <textarea
                  value={mission}
                  onChange={(e) => setMission(e.target.value)}
                  placeholder="Detail your programs..."
                  rows={3}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 focus:outline-none transition-all placeholder:text-neutral-400 leading-relaxed font-normal bg-slate-50/50"
                />
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3.5 border-t border-slate-100 text-[11px] text-slate-400 leading-relaxed">
            Specify focus keywords like <span className="font-semibold text-indigo-600 font-mono text-[10px]">education</span>, <span className="font-semibold text-indigo-600 font-mono text-[10px]">health</span>, or <span className="font-semibold text-indigo-600 font-mono text-[10px]">environment</span>.
          </div>
        </div>

        {/* Bento Cell 4: Compliance Identity Fields Form (Compliance Safeguards) */}
        <div className="lg:col-span-3 bg-white rounded-3xl border border-slate-200 shadow-sm p-5 flex flex-col justify-between transition-all hover:shadow-md min-h-[280px]">
          <div className="space-y-3.5">
            <div className="flex items-center gap-2 border-b border-slate-150 pb-3">
              <div className="p-1.5 bg-rose-50 rounded-lg text-rose-600">
                <Lock className="h-4 w-4" />
              </div>
              <h3 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider font-display">Compliance Safeguards</h3>
            </div>
            
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Simulate sensitive details loaded in proposal forms. Secure regex parsers scrubbing occurs locally before remote processing.
            </p>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1">Contact Email</label>
                <input
                  type="text"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@nonprofit.org"
                  className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 focus:border-indigo-600 focus:outline-none bg-slate-50/50 font-mono text-[11px]"
                />
              </div>
              <div>
                <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1">Contact Phone</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="555-123-4567"
                  className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 focus:border-indigo-600 focus:outline-none bg-slate-50/50 font-mono text-[11px]"
                />
              </div>
            </div>

            <div>
              <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1">Corporate EIN ID</label>
              <input
                type="text"
                value={ein}
                onChange={(e) => setEin(e.target.value)}
                placeholder="12-3456789"
                className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 focus:border-indigo-600 focus:outline-none bg-slate-50/50 font-mono text-[11px]"
              />
            </div>
          </div>

          <div className="mt-4 pt-3 text-[10px] font-bold text-rose-600 uppercase tracking-wider bg-rose-50 p-2.5 rounded-xl border border-rose-100/60 flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-rose-500 animate-pulse"></span>
            Automatic PII Redactor Enabled
          </div>
        </div>

        {/* ROW 2: Secured Grants | Target Range | URGENT DEADLINES | Index Logs */}

        {/* Bento Cell 5: Live Success Statistics (Secured Grants) */}
        <div className="lg:col-span-3 bg-indigo-600 text-white rounded-3xl p-5 shadow-md flex flex-col justify-between transition-all hover:-translate-y-1 hover:shadow-indigo-200/50 hover:shadow-lg min-h-[160px]">
          <div className="flex justify-between items-center">
            <span className="text-indigo-100 text-xs font-bold uppercase tracking-wider font-mono">Secured Grants</span>
            <div className="w-8 h-8 bg-indigo-500/50 rounded-full flex items-center justify-center text-sm font-bold">↗</div>
          </div>
          <div>
            <div className="text-5xl font-black font-display tracking-tight leading-none mb-1">{successRateMock}</div>
            <p className="text-indigo-100 text-[11px] leading-relaxed">
              Mock platform success rate matching records this quarter across associated test accounts.
            </p>
          </div>
          <div className="pt-3 border-t border-indigo-500/40 flex justify-between items-center text-[10px]">
            <span className="text-indigo-200 font-semibold uppercase font-mono">Fit Status</span>
            <span className="bg-emerald-500/30 text-emerald-100 px-2 py-0.5 rounded font-extrabold">98.3% optimal</span>
          </div>
        </div>

        {/* Bento Cell 6: Matching Parameters Tracker (Target Range) */}
        <div className="lg:col-span-3 bg-white rounded-3xl border border-slate-200 shadow-sm p-5 flex flex-col justify-between transition-all hover:shadow-md min-h-[160px]">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-slate-400 text-[10px] font-extrabold uppercase tracking-wider font-mono">Target Range</span>
              <h3 className="text-2xl font-black text-slate-800 font-display mt-0.5">${targetBudget}k — $1.2M</h3>
            </div>
            <div className="p-1.5 bg-slate-100 rounded-lg text-slate-500 font-mono text-[10px] font-bold">
              FLUID
            </div>
          </div>

          <div className="my-4">
            <label className="block text-[9px] font-bold text-slate-500 uppercase mb-2">Adjust Target Search Limit</label>
            <input 
              type="range" 
              min="10" 
              max="500" 
              value={targetBudget}
              onChange={(e) => setTargetBudget(Number(e.target.value))}
              className="w-full h-1.5 bg-slate-150 rounded-lg appearance-none cursor-pointer accent-indigo-600"
            />
            <div className="flex justify-between text-[9px] text-slate-400 font-mono mt-1 font-bold">
              <span>$10k</span>
              <span>$500k</span>
            </div>
          </div>

          <div className="w-full bg-slate-50 p-2.5 rounded-xl border border-slate-100 flex items-center justify-between text-[11px] font-semibold text-slate-600">
            <span>Scan Area:</span>
            <span className="font-bold text-indigo-600 uppercase font-mono">Global database</span>
          </div>
        </div>

        {/* Bento Cell 7: Urgent Alert Card (URGENT DEADLINES) */}
        <div className="lg:col-span-3 bg-rose-50 border border-rose-100 rounded-3xl p-5 shadow-sm flex flex-col justify-between transition-all hover:shadow-md min-h-[160px]">
          <div className="flex justify-between items-start">
            <div className="p-2.5 bg-rose-100 rounded-2xl text-rose-600 font-bold">
              <Clock className="h-4 w-4" />
            </div>
            <span className="text-rose-600 text-[10px] font-extrabold uppercase tracking-wider font-mono">URGENT DEADLINES</span>
          </div>
          <div>
            <div className="text-xs text-rose-800 font-bold font-display uppercase tracking-wider">EdTech Innovation</div>
            <div className="text-2xl font-black text-rose-600">48h LEFT</div>
          </div>
          <p className="text-[11px] text-rose-700/80 leading-normal mt-1">
            Apply promptly to lock tutoring allocations.
          </p>
        </div>

        {/* Bento Cell 8: Index Logs */}
        <div className="lg:col-span-3 bg-white rounded-3xl border border-slate-200 p-5 flex flex-col justify-between transition-all hover:shadow-md min-h-[160px]">
          <div className="space-y-4">
            <span className="text-slate-400 text-[10px] font-extrabold uppercase tracking-wider font-mono">Index Logs</span>
            
            <div className="space-y-3.5">
              <div>
                <div className="text-3xl font-black text-slate-800 font-display">8,124</div>
                <div className="text-[9px] text-slate-400 uppercase font-extrabold tracking-wider font-mono">Files Indexed</div>
              </div>
              <div className="h-px bg-slate-100" />
              <div>
                <div className="text-3xl font-black text-slate-800 font-display">24</div>
                <div className="text-[9px] text-slate-400 uppercase font-extrabold tracking-wider font-mono">Approved Drafts</div>
              </div>
            </div>
          </div>

          <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100/70 text-[10px] uppercase font-mono tracking-wider font-bold text-slate-400 flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping"></span>
            Telemetry Online
          </div>
        </div>

        {/* ROW 3: Coordinator Orchestrator Workspace (Full Width) */}

        {/* Bento Cell 9: Primary Dynamic Playground / Coordinator Orchestrator Workspace */}
        <div className="lg:col-span-12 bg-white rounded-3xl border border-slate-200 shadow-sm p-6 flex flex-col justify-start transition-all shadow-indigo-50/10">
          
          {/* Main Controls Header of active workshop */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-150 pb-4 mb-4 gap-4">
            <div>
              <h3 className="text-lg font-black tracking-tight text-slate-800 font-display flex items-center gap-2">
                <Cpu className="h-5 w-5 text-indigo-600 animate-spin" style={{ animationDuration: "6s" }} />
                <span>
                  {activeTab === "coordinator" && "Coordinator Orchestrator Workspace"}
                  {activeTab === "researcher" && "Researcher Agent Workspace"}
                  {activeTab === "writer" && "Writer Agent Workspace"}
                  {activeTab === "reviewer" && "Reviewer Agent Workspace"}
                </span>
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                {activeTab === "coordinator" && "End-to-End reasoning with intermediate reflection logs and compliance redacting"}
                {activeTab === "researcher" && "Direct simulation tool querying corporate databases"}
                {activeTab === "writer" && "Persuasive composition matching non-profit mission coordinates"}
                {activeTab === "reviewer" && "Integrity scanning, custom markdown formatting, and validation check"}
              </p>
            </div>

            {activeTab === "coordinator" && (
              <button
                onClick={handleRunCoordinator}
                disabled={isRunningCoordinator || !mission.trim() || geminiConfigured === false}
                className={`py-2 px-5 rounded-xl flex items-center justify-center gap-2 text-xs font-bold font-display transition-all ${
                  isRunningCoordinator 
                    ? "bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed" 
                    : geminiConfigured === false
                      ? "bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed"
                      : "bg-indigo-600 text-white hover:bg-indigo-700 cursor-pointer shadow-md shadow-indigo-100 active:scale-98"
                }`}
              >
                {isRunningCoordinator ? (
                  <>
                    <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                    <span>Processing Team...</span>
                  </>
                ) : (
                  <>
                    <Play className="h-3.5 w-3.5 fill-current" />
                    <span>Run Coordinator</span>
                  </>
                )}
              </button>
            )}
          </div>

          {/* Show any global errors */}
          {errorMessage && (
            <div className="p-4 bg-rose-50 border border-rose-150 text-rose-800 rounded-xl text-xs flex items-start gap-2.5 animate-fadeIn mb-4">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-rose-600" />
              <div className="leading-relaxed">
                <span className="font-bold">Execution Error:</span> {errorMessage}
              </div>
            </div>
          )}

          <div className="flex-1 flex flex-col justify-between">
            <AnimatePresence mode="wait">
              
              {/* TAB 1: COORDINATOR TIMELINE AND LIVE LOGS */}
              {activeTab === "coordinator" && (
                <motion.div
                  key="coordinator"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="flex flex-col gap-5"
                >
                  {/* Split terminal logs + result preview */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                    
                    {/* Live Terminal Log Stream — fixed height, scrollable */}
                    <div className="lg:col-span-4 bg-slate-900 text-slate-100 rounded-2xl border border-slate-800 p-4 shadow-inner flex flex-col h-[450px]">
                      <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-3">
                        <div className="flex items-center gap-1.5 text-slate-300">
                          <Terminal className="h-3.5 w-3.5 text-emerald-400" />
                          <span className="text-[10px] font-extrabold font-mono uppercase tracking-wider">A2A Inference Trace</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                          <span className="text-[9px] font-mono text-slate-500 uppercase font-bold">Trace Live</span>
                        </div>
                      </div>

                      <div className="flex-1 overflow-y-auto space-y-3.5 pr-1 font-mono text-[11px] leading-relaxed select-text">
                        {coordinatorLogs.length === 0 ? (
                          <div className="text-slate-500 flex flex-col items-center justify-center h-full text-center p-4">
                            <Cpu className="h-7 w-7 mb-2 text-slate-700 animate-pulse" />
                            <p className="font-mono text-xs text-slate-400 font-bold">Console Ready.</p>
                            <p className="text-[10px] mt-1 text-slate-500 max-w-xs">Click &quot;Run Coordinator&quot; above to initiate search, narrative composition, and security filter scans.</p>
                          </div>
                        ) : (
                          coordinatorLogs.map((log, i) => (
                            <div key={i} className="border-l border-slate-800 pl-2.5 py-0.5">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-[9px] text-slate-500 font-sans">{log.timestamp}</span>
                                {getAgentLabel(log.agent)}
                              </div>
                              <span className={getLogColor(log.type)}>
                                {log.message}
                              </span>
                            </div>
                          ))
                        )}
                        <div ref={logsEndRef} />
                      </div>
                    </div>

                    {/* Result Content viewer */}
                    <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200 p-5 shadow-inner flex flex-col h-[450px]">
                      {coordinatorResult ? (
                        <div className="flex flex-col h-full justify-between">
                          
                          {/* Inner Tabs */}
                          <div className="flex border-b border-slate-100 pb-2.5 mb-3 gap-1.5 shrink-0 overflow-x-auto">
                            <button
                              onClick={() => setSelectedResultSubTab("final")}
                              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap ${
                                selectedResultSubTab === "final" 
                                  ? "bg-slate-900 text-white" 
                                  : "text-slate-500 hover:text-slate-900 bg-slate-50"
                              }`}
                            >
                              <FileCheck2 className="h-3.5 w-3.5 text-rose-500" />
                              <span>Final Proposal</span>
                            </button>
                            <button
                              onClick={() => setSelectedResultSubTab("rawDraft")}
                              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap ${
                                selectedResultSubTab === "rawDraft" 
                                  ? "bg-slate-900 text-white" 
                                  : "text-slate-500 hover:text-slate-900 bg-slate-50"
                              }`}
                            >
                              <PenTool className="h-3.5 w-3.5 text-amber-500" />
                              <span>Raw Draft</span>
                            </button>
                            <button
                              onClick={() => setSelectedResultSubTab("grants")}
                              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap ${
                                selectedResultSubTab === "grants" 
                                  ? "bg-slate-900 text-white" 
                                  : "text-slate-500 hover:text-slate-900 bg-slate-50"
                              }`}
                            >
                              <Search className="h-3.5 w-3.5 text-indigo-500" />
                              <span>Grants Database</span>
                            </button>
                          </div>

                          {/* Inner content display */}
                          <div className="flex-1 overflow-y-auto min-h-0 bg-slate-50 p-4 rounded-xl border border-slate-150 select-text">
                            {selectedResultSubTab === "final" && (
                              <div className="prose prose-sm font-sans max-w-none text-xs leading-relaxed text-slate-700">
                                <div className="mb-3 p-3 bg-rose-50 border border-rose-100 rounded-xl flex items-center justify-between text-rose-800 text-xs shadow-sm">
                                  <span className="font-bold flex items-center gap-1.5">
                                    <ShieldCheck className="h-4 w-4 text-rose-600" />
                                    Scrubbed Proposal Package
                                  </span>
                                  {coordinatorResult.hasRedactions ? (
                                    <span className="bg-rose-100 text-rose-700 px-2.5 py-0.5 rounded-full font-bold font-mono text-[9px] uppercase tracking-wider">
                                      Compliance scrub success
                                    </span>
                                  ) : (
                                    <span className="bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full font-medium text-[9px]">
                                      No raw credentials detected
                                    </span>
                                  )}
                                </div>
                                <div className="markdown-body text-slate-800 leading-relaxed">
                                  <ReactMarkdown>{coordinatorResult.finalizedProposal}</ReactMarkdown>
                                </div>
                              </div>
                            )}

                            {selectedResultSubTab === "rawDraft" && (
                              <div className="space-y-3 font-sans max-w-none text-xs leading-relaxed text-slate-700">
                                <div className="p-3 bg-amber-50/70 border border-amber-100 text-amber-800 rounded-xl text-[10px] italic font-medium leading-relaxed">
                                  * Raw composition designed by Writer agent. This text contains identity numbers and direct phone logs that must be scrubbed prior to dispatch.
                                </div>
                                <div className="whitespace-pre-wrap font-sans text-slate-800 font-medium">
                                  {coordinatorResult.rawProposalDraft}
                                </div>
                              </div>
                            )}

                            {selectedResultSubTab === "grants" && (
                              <div className="space-y-4 text-xs font-sans">
                                <div>
                                  <h4 className="font-extrabold text-slate-900 uppercase tracking-wider text-[10px] mb-1 flex items-center gap-1">
                                    <Info className="h-3.5 w-3.5 text-indigo-600" />
                                    Match Rationale
                                  </h4>
                                  <p className="text-slate-700 leading-relaxed font-sans bg-white p-3 rounded-xl border border-slate-200">
                                    {coordinatorResult.researchSummary}
                                  </p>
                                </div>
                                <div className="pt-3 border-t border-slate-200/50">
                                  <h4 className="font-extrabold text-slate-900 uppercase tracking-wider text-[10px] mb-1.5 font-mono">search_grants tool returned:</h4>
                                  <div className="bg-slate-900 p-3 rounded-xl border font-mono text-[11px] text-emerald-400 border-slate-800 whitespace-pre-wrap">
                                    {coordinatorResult.grantsSearchRaw}
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center h-full text-center p-6 text-slate-400 gap-2">
                          <FileText className="h-10 w-10 text-slate-350" />
                          <p className="font-sans font-bold text-xs text-slate-600 uppercase tracking-wider">Output Board</p>
                          <p className="text-[11px] max-w-xs text-slate-400 leading-relaxed">Agent orchestration output and structured PDF data drafts will appear here on completion.</p>
                        </div>
                      )}
                    </div>

                  </div>
                </motion.div>
              )}

              {/* TAB 2: RESEARCHER SANDBOX */}
              {activeTab === "researcher" && (
                <motion.div
                  key="researcher"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="flex flex-col gap-5 flex-1 justify-between h-full"
                >
                  <div className="space-y-4">
                    <div>
                      <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-1.5">Enter Search Keywords or Mission Mission Description</label>
                      <input
                        type="text"
                        value={researcherQuery}
                        onChange={(e) => setResearcherQuery(e.target.value)}
                        placeholder="e.g. tutoring, green earth action, health clinics"
                        className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 focus:border-indigo-600 focus:outline-none transition-all placeholder:text-neutral-400 font-medium bg-slate-50/50"
                      />
                    </div>

                    <button
                      onClick={handleRunResearcher}
                      disabled={isSearchingGrants || !researcherQuery.trim() || geminiConfigured === false}
                      className="inline-flex items-center justify-center gap-1.5 py-2 px-5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold font-display shadow-md shadow-indigo-100 cursor-pointer disabled:bg-slate-100 disabled:text-slate-400 disabled:shadow-none disabled:border-slate-200 disabled:cursor-not-allowed"
                    >
                      {isSearchingGrants ? (
                        <>
                          <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                          <span>Searching Database...</span>
                        </>
                      ) : (
                        <>
                          <Search className="h-3.5 w-3.5" />
                          <span>Execute Researcher</span>
                        </>
                      )}
                    </button>
                  </div>

                  {researchResult ? (
                    <div className="mt-4 p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-4 text-xs overflow-y-auto flex-1 min-h-[220px]">
                      <div>
                        <h4 className="font-extrabold text-slate-900 uppercase tracking-wider text-[10px] mb-1.5 flex items-center gap-1.5 font-mono">
                          <Terminal className="h-3.5 w-3.5 text-slate-500" />
                          search_grants tool payload:
                        </h4>
                        <pre className="bg-slate-900 p-3 rounded-xl border border-slate-850 font-mono text-[11px] text-emerald-400 whitespace-pre-wrap select-text">
                          {researchResult.grantsFound}
                        </pre>
                      </div>

                      <div>
                        <h4 className="font-extrabold text-slate-900 uppercase tracking-wider text-[10px] mb-1.5 flex items-center gap-1">
                          <Cpu className="h-3.5 w-3.5 text-indigo-600 animate-spin" />
                          Researcher Narrative (Gemini evaluation)
                        </h4>
                        <div className="p-3.5 bg-white rounded-xl border border-slate-200 leading-relaxed text-slate-700 select-text">
                          {researchResult.summary}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-slate-400 text-center gap-2 py-8 min-h-[220px]">
                      <Database className="h-8 w-8 text-slate-300" />
                      <p className="text-xs font-bold uppercase tracking-wide">Developer Sandbox</p>
                      <p className="text-[11px]">Run keywords search against custom database datasets.</p>
                    </div>
                  )}
                </motion.div>
              )}

              {/* TAB 3: WRITER SANDBOX */}
              {activeTab === "writer" && (
                <motion.div
                  key="writer"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="flex flex-col gap-4 flex-1 justify-between h-full"
                >
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-1">Non-Profit Profile Context</label>
                        <textarea
                          value={writerProfile}
                          onChange={(e) => setWriterProfile(e.target.value)}
                          rows={3}
                          placeholder="Organization name, location, past works, or mission priorities..."
                          className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 focus:border-indigo-600 focus:outline-none transition-all placeholder:text-neutral-400 bg-slate-50/50"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-1">Target Grant Prereqs</label>
                        <textarea
                          value={writerGrantDetails}
                          onChange={(e) => setWriterGrantDetails(e.target.value)}
                          rows={3}
                          placeholder="e.g. Community Wellness Initiative ($100,000 for local clinics)"
                          className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 focus:border-indigo-600 focus:outline-none transition-all placeholder:text-neutral-400 bg-slate-50/50"
                        />
                      </div>
                    </div>

                    <button
                      onClick={handleRunWriter}
                      disabled={isDraftingProposal || !writerProfile.trim() || !writerGrantDetails.trim() || geminiConfigured === false}
                      className="inline-flex items-center justify-center gap-1.5 py-2 px-5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold font-display shadow-md shadow-indigo-100 cursor-pointer disabled:bg-slate-100 disabled:text-slate-400 disabled:shadow-none disabled:border-slate-200 disabled:cursor-not-allowed"
                    >
                      {isDraftingProposal ? (
                        <>
                          <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                          <span>Drafting Proposal...</span>
                        </>
                      ) : (
                        <>
                          <PenTool className="h-3.5 w-3.5" />
                          <span>Execute Writer Agent</span>
                        </>
                      )}
                    </button>
                  </div>

                  {writerResult ? (
                    <div className="mt-4 p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs overflow-y-auto flex-1 min-h-[200px]">
                      <h4 className="font-extrabold text-slate-900 uppercase tracking-wider text-[10px] mb-1">
                        Generated Draft Proposal
                      </h4>
                      <div className="p-3.5 bg-white rounded-xl border border-slate-200 leading-relaxed text-slate-700 whitespace-pre-wrap font-sans select-text">
                        {writerResult.draft}
                      </div>
                    </div>
                  ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-slate-400 text-center gap-2 py-8 min-h-[200px]">
                      <PenTool className="h-8 w-8 text-slate-350" />
                      <p className="text-xs font-bold uppercase tracking-wide">Composition Sandbox</p>
                      <p className="text-[11px]">Generate standard application arguments aligning context variables.</p>
                    </div>
                  )}
                </motion.div>
              )}

              {/* TAB 4: REVIEWER SANDBOX */}
              {activeTab === "reviewer" && (
                <motion.div
                  key="reviewer"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="flex flex-col gap-4 flex-1 justify-between h-full"
                >
                  <div className="space-y-4">
                    <div>
                      <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-1">Raw text to check compliance (include sample emails or telephones to verify regex masks)</label>
                      <textarea
                        value={reviewerRawText}
                        onChange={(e) => setReviewerRawText(e.target.value)}
                        rows={3}
                        placeholder="Insert text containing telephone (e.g., 555-019-2834) or emails (e.g., admin@host.com)..."
                        className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 focus:border-indigo-600 focus:outline-none transition-all placeholder:text-neutral-400 font-mono text-[11px] bg-slate-50/50"
                      />
                    </div>

                    <button
                      onClick={handleRunReviewer}
                      disabled={isReviewingText || !reviewerRawText.trim() || geminiConfigured === false}
                      className="inline-flex items-center justify-center gap-1.5 py-2 px-5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold font-display shadow-md shadow-indigo-100 cursor-pointer disabled:bg-slate-100 disabled:text-slate-400 disabled:shadow-none disabled:border-slate-200 disabled:cursor-not-allowed"
                    >
                      {isReviewingText ? (
                        <>
                          <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                          <span>Scanning with redact_pii...</span>
                        </>
                      ) : (
                        <>
                          <ShieldCheck className="h-3.5 w-3.5" />
                          <span>Execute Compliance Scan</span>
                        </>
                      )}
                    </button>
                  </div>

                  {reviewerResult ? (
                    <div className="mt-4 p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-4 text-xs overflow-y-auto flex-1 min-h-[220px]">
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <h4 className="font-extrabold text-slate-900 uppercase tracking-wider text-[10px] flex items-center gap-1.5 font-mono">
                            <Lock className="h-3.5 w-3.5 text-neutral-500" />
                            Security redact_pii Scrubbed Text:
                          </h4>
                          {reviewerResult.hasRedactions ? (
                            <span className="bg-rose-100 text-rose-700 px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase tracking-wider">Mask markers replaced</span>
                          ) : (
                            <span className="text-[10px] text-slate-450 italic font-medium">Clear of markers</span>
                          )}
                        </div>
                        <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 font-mono text-[11px] text-slate-300 whitespace-pre-wrap select-text">
                          {reviewerResult.redactedText}
                        </div>
                      </div>

                      <div>
                        <h4 className="font-extrabold text-slate-900 uppercase tracking-wider text-[10px] mb-1.5 flex items-center gap-1">
                          <FileCheck2 className="h-3.5 w-3.5 text-emerald-600" />
                          Polished compliance Output (rendered Markdown)
                        </h4>
                        <div className="p-3.5 bg-white rounded-xl border border-slate-200 leading-relaxed text-slate-700 prose prose-sm select-text">
                          <div className="markdown-body">
                            <ReactMarkdown>{reviewerResult.finalProposal}</ReactMarkdown>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-slate-400 text-center gap-2 py-8 min-h-[220px]">
                      <ShieldCheck className="h-8 w-8 text-rose-300" />
                      <p className="text-xs font-bold uppercase tracking-wide">Compliance QA Sandbox</p>
                      <p className="text-[11px]">Audit texts for emails, SSNs, and phone number parameters.</p>
                    </div>
                  )}
                </motion.div>
              )}

            </AnimatePresence>
          </div>

        </div>

        {/* ROW 4: Active Agent Inference Activity (Full Width) */}

        {/* Bento Cell 10: Dynamic Simulated Match Inference Activity Bar */}
        <div className="lg:col-span-12 bg-white rounded-3xl border border-slate-200 p-5 flex flex-col transition-all hover:shadow-md">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 font-mono flex items-center gap-1.5">
                <TrendingUp className="h-3.5 w-3.5 text-indigo-500" />
                Active Agent Inference Activity
              </h3>
              <p className="text-[11px] text-slate-500 leading-relaxed mt-0.5">Real-time mock representation of token execution parameters across matching heuristics.</p>
            </div>
            
            <div className="flex gap-1">
              <div className="w-2 h-2 rounded-full bg-indigo-500"></div>
              <div className="w-2 h-2 rounded-full bg-slate-200"></div>
              <div className="w-2 h-2 rounded-full bg-slate-200"></div>
            </div>
          </div>

          <div className="h-12 flex items-end gap-1.5 px-1 pt-2">
            <div className="flex-1 bg-indigo-50 h-[30%] rounded-md hover:bg-indigo-600 transition-colors" title="Heuristic check: index"></div>
            <div className="flex-1 bg-indigo-100 h-[45%] rounded-md hover:bg-indigo-600 transition-colors" title="Check keywords score"></div>
            <div className="flex-1 bg-indigo-200/80 h-[65%] rounded-md hover:bg-indigo-600 transition-colors" title="Tool execute: list range"></div>
            <div className="flex-1 bg-indigo-300/80 h-[40%] rounded-md hover:bg-indigo-600 transition-colors" title="Coordinator proxy routing"></div>
            <div className="flex-1 bg-indigo-400/80 h-[80%] rounded-md hover:bg-indigo-600 transition-colors" title="Gemini 3.5 structured prompt call"></div>
            <div className="flex-1 bg-indigo-500 h-[95%] rounded-md hover:bg-indigo-600 transition-colors" title="compliance scan: regex parse matching"></div>
            <div className="flex-1 bg-indigo-600 h-[70%] rounded-md hover:bg-indigo-600 transition-colors" title="compliance scan: format check"></div>
            <div className="flex-1 bg-indigo-400/80 h-[55%] rounded-md hover:bg-indigo-600 transition-colors" title="deliverable validation"></div>
            <div className="flex-1 bg-indigo-200/80 h-[40%] rounded-md hover:bg-indigo-600 transition-colors" title="Coordinator delivery package"></div>
            <div className="flex-1 bg-indigo-150 h-[20%] rounded-md hover:bg-indigo-600 transition-colors" title="Logs flushing"></div>
            <div className="flex-1 bg-indigo-50 h-[10%] rounded-md hover:bg-indigo-600 transition-colors" title="Cooldown node state"></div>
          </div>
        </div>

      </main>

      {/* Footer styled exactly like layout template */}
      <footer className="bg-slate-50 border-t border-slate-200/70 py-6 px-4 md:px-6 mt-12 max-w-7xl w-full mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
        <p className="font-medium text-slate-500">
          Based on the experimental <span className="font-extrabold text-slate-700">urvashi933/grantmatch-agent</span> project model.
        </p>
        <div className="flex items-center gap-3">
          <a 
            href="https://github.com/urvashi933/grantmatch-agent" 
            target="_blank" 
            rel="noreferrer" 
            className="hover:text-indigo-600 transition-colors flex items-center gap-1 font-bold text-slate-500"
          >
            <span>Reference Repository</span>
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </div>
      </footer>

    </div>
  );
}
