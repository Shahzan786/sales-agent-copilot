import React, { useState, useEffect, useRef } from 'react';
import { 
  MessageSquare, 
  FileText, 
  Mail, 
  Users, 
  CheckCircle, 
  AlertCircle, 
  Database, 
  Cpu, 
  Send, 
  Bot,
  ChevronRight,
  Shield,
  Loader2,
  X
} from 'lucide-react';

// --- Types & Mock Data ---

type AppState = 'email_view' | 'drafting_view' | 'teams_approval_view';
type AgentState = 'idle' | 'analyzing' | 'fetching_data' | 'drafting' | 'awaiting_approval';

interface Message {
  id: string;
  sender: 'user' | 'agent' | 'system';
  text: string;
  thoughts?: string[]; // Internal monologue/reasoning steps
  actions?: AgentAction[];
}

interface AgentAction {
  label: string;
  type: 'crm_lookup' | 'policy_check' | 'generate_doc' | 'teams_ping';
  status: 'pending' | 'success' | 'warning' | 'error';
  details?: string;
}

const CRM_DATA = {
  client: "Acme Corp",
  dealSize: "$150k",
  products: ["Enterprise License x500", "Premium Support"],
  status: "Qualified Opportunity",
  lastInteraction: "2 days ago"
};

const POLICY_DATA = {
  maxDiscountAuto: 15,
  approvalRequired: true,
  approver: "Sarah Jenkins (VP Sales)"
};

// --- Main Component ---

export default function SalesAgentPrototype() {
  const [appView, setAppView] = useState<AppState>('email_view');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      sender: 'agent',
      text: "Hi Alex. I noticed the email from Acme Corp regarding the enterprise license renewal. Would you like me to prepare a proposal based on their usage data and our Q1 pricing?",
      thoughts: ["Detected intent: Inbound sales inquiry", "Identified entity: Acme Corp", "Context: Email open"],
    }
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [proposalContent, setProposalContent] = useState<string>("");
  const [discount, setDiscount] = useState<number>(0);
  const [approvalStatus, setApprovalStatus] = useState<'none' | 'pending' | 'approved'>('none');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  // --- Agent Logic Simulation ---

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;
    
    const userMsg = inputValue;
    setInputValue("");
    addMessage('user', userMsg);
    setIsTyping(true);

    // Simulate Agent Processing Delay
    setTimeout(() => {
      processUserIntent(userMsg);
    }, 1500);
  };

  const addMessage = (sender: 'user' | 'agent' | 'system', text: string, thoughts: string[] = [], actions: AgentAction[] = []) => {
    setMessages(prev => [...prev, { id: Date.now().toString(), sender, text, thoughts, actions }]);
  };

  const processUserIntent = (text: string) => {
    const lowerText = text.toLowerCase();
    setIsTyping(false);

    // Scenario 1: Create Proposal
    if (lowerText.includes("yes") || lowerText.includes("create") || lowerText.includes("draft")) {
      setAppView('drafting_view');
      addMessage('agent', "I'm drafting the proposal now. I'm pulling the latest pricing from the ERP and Acme's usage stats from Salesforce.", 
        [
          "Context Switch: Word API",
          "Fetch: GET /crm/acme-corp/details",
          "Fetch: GET /finance/pricing/2026-Q1",
          "Logic: Select Template 'Enterprise_SaaS_v4'"
        ],
        [
          { label: "CRM Data Retrieved", type: 'crm_lookup', status: 'success', details: "Acme Corp ID: 99281" },
          { label: "Pricing Validated", type: 'policy_check', status: 'success', details: "Standard Tier Applied" },
          { label: "Draft Generated", type: 'generate_doc', status: 'success', details: "v0.1 created" }
        ]
      );
      setProposalContent(generateProposal(0));
      return;
    }

    // Scenario 2: Add Discount
    if (lowerText.includes("discount") || lowerText.includes("%")) {
      const discountMatch = text.match(/(\d+)%/);
      const requestedDiscount = discountMatch ? parseInt(discountMatch[1]) : 20;
      
      if (requestedDiscount > POLICY_DATA.maxDiscountAuto) {
        setDiscount(requestedDiscount);
        setAppView('drafting_view'); // Stay on doc
        
        addMessage('agent', `I've updated the draft with a ${requestedDiscount}% discount. However, this exceeds the 15% auto-approval limit defined in the Northstar Sales Policy. I can draft an approval request to Sarah Jenkins for you.`, 
          [
            `Action: Update Document (Discount: ${requestedDiscount}%)`,
            `Check: Policy Engine (Max: ${POLICY_DATA.maxDiscountAuto}%)`,
            `Alert: Threshold Exceeded`,
            `Identify Approver: Sarah Jenkins`
          ],
          [
            { label: "Policy Warning", type: 'policy_check', status: 'warning', details: `>${POLICY_DATA.maxDiscountAuto}% requires VP approval` }
          ]
        );
        setProposalContent(generateProposal(requestedDiscount));
      } else {
        setDiscount(requestedDiscount);
        setProposalContent(generateProposal(requestedDiscount));
        addMessage('agent', `Applied a ${requestedDiscount}% discount. This is within your approval limit.`, [], 
           [{ label: "Policy Check Passed", type: 'policy_check', status: 'success', details: "Auto-approved" }]
        );
      }
      return;
    }

    // Scenario 3: Request Approval
    if (lowerText.includes("approve") || lowerText.includes("sarah") || lowerText.includes("ask")) {
      setAppView('teams_approval_view');
      setApprovalStatus('pending');
      
      addMessage('agent', "I've sent a card to Sarah Jenkins via Teams with the proposal summary and justification. I'll let you know when she responds.",
        [
          "Context Switch: Teams API",
          "Action: Post Adaptive Card to user:sjenkins",
          "Monitor: Webhook for Approval Status"
        ],
        [
          { label: "Approval Request Sent", type: 'teams_ping', status: 'success', details: "Teams Activity ID: #8821" }
        ]
      );

      // Simulate Approval after delay
      setTimeout(() => {
        setApprovalStatus('approved');
        setAppView('drafting_view'); // Switch back to doc to show it's clean
        addMessage('agent', "Great news! Sarah approved the 20% discount. I've attached the approval record to the Salesforce opportunity and finalized the proposal PDF.", 
          [
             "Event: Approval Received (Teams)",
             "Action: Log Audit Trail to CRM",
             "Action: Finalize Document (Remove Watermark)"
          ],
          [
            { label: "Approval Verified", type: 'teams_ping', status: 'success', details: "Approved by S. Jenkins" },
            { label: "CRM Updated", type: 'crm_lookup', status: 'success', details: "Deal Stage: Negotiation" }
          ]
        );
      }, 5000);
      return;
    }

    // Default Fallback
    addMessage('agent', "I can help you draft proposals, check pricing, or coordinate approvals. Try asking me to 'Create a proposal'.");
  };

  const generateProposal = (disc: number) => {
    const baseTotal = 150000;
    const finalTotal = baseTotal * ((100 - disc) / 100);
    
    // We generate HTML strings directly for the "Doc" preview to ensure it looks good
    // without needing a complex Markdown parser in this prototype.
    return `
      <h1 class="text-3xl font-bold mb-4 border-b-2 border-slate-800 pb-2">PROPOSAL FOR ACME CORP</h1>
      <div class="mb-6 text-sm">
        <p><strong>Date:</strong> January 15, 2026</p>
        <p><strong>Prepared by:</strong> Alex Doe (Northstar Enterprises)</p>
      </div>

      <h2 class="text-xl font-bold text-blue-800 mt-6 mb-3">EXECUTIVE SUMMARY</h2>
      <p class="mb-4">Northstar Enterprises is pleased to present this proposal to Acme Corp for the renewal and expansion of your Enterprise Productivity Suite.</p>

      <h2 class="text-xl font-bold text-blue-800 mt-6 mb-3">SOLUTION OVERVIEW</h2>
      <p class="mb-4">Based on your usage of the 'Alpha' tier, we recommend upgrading to the 'Enterprise' tier to unlock advanced AI agents.</p>

      <h2 class="text-xl font-bold text-blue-800 mt-6 mb-3">PRICING</h2>
      <div class="w-full border border-slate-300 text-sm">
        <div class="grid grid-cols-4 bg-slate-100 font-bold p-2 border-b border-slate-300">
          <div>Item</div>
          <div>Qty</div>
          <div>Unit Price</div>
          <div>Total</div>
        </div>
        <div class="grid grid-cols-4 p-2 border-b border-slate-100">
          <div>Enterprise License</div>
          <div>500</div>
          <div>$300</div>
          <div>$150,000</div>
        </div>
        <div class="grid grid-cols-4 p-2 border-b border-slate-100">
          <div>Premium Support</div>
          <div>1</div>
          <div>Included</div>
          <div>$0</div>
        </div>
        <div class="grid grid-cols-4 p-2 font-bold bg-slate-50">
          <div class="col-span-3 text-right pr-4">Subtotal</div>
          <div>$150,000</div>
        </div>
        ${disc > 0 ? `
        <div class="grid grid-cols-4 p-2 font-bold text-green-700 bg-green-50">
          <div class="col-span-3 text-right pr-4">Discount (${disc}%)</div>
          <div>-$${(baseTotal - finalTotal).toLocaleString()}</div>
        </div>
        ` : ''}
        <div class="grid grid-cols-4 p-2 font-black text-lg border-t-2 border-slate-800 mt-1">
          <div class="col-span-3 text-right pr-4">Grand Total</div>
          <div>$${finalTotal.toLocaleString()}</div>
        </div>
      </div>

      ${disc > 15 && approvalStatus !== 'approved' ? `
      <div class="mt-8 p-4 bg-yellow-50 border-l-4 border-yellow-500 text-yellow-800 text-sm">
        <strong>⚠️ INTERNAL NOTE: PENDING APPROVAL</strong><br/>
        This draft contains a discount exceeding 15%. Do not share externally until approved.
      </div>
      ` : ''}

      <h2 class="text-xl font-bold text-blue-800 mt-6 mb-3">TERMS</h2>
      <p class="mb-4">Valid for 30 days. Standard MSA applies.</p>
    `;
  };

  return (
    <div className="flex h-screen w-full bg-slate-50 font-sans text-slate-900 overflow-hidden">
      
      {/* LEFT PANEL: Copilot / Agent */}
      <div className="w-[400px] flex flex-col border-r border-slate-200 bg-white shadow-xl z-10">
        {/* Header */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-blue-600 to-indigo-700 text-white">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-white/20 rounded-lg">
              <Bot size={20} className="text-white" />
            </div>
            <div>
              <h1 className="font-semibold text-sm leading-tight">Northstar Agent</h1>
              <p className="text-[10px] text-blue-100 opacity-90">Powered by M365 Copilot</p>
            </div>
          </div>
          <div className="flex gap-2">
             <span className="px-2 py-0.5 bg-green-400/20 text-green-100 text-[10px] rounded-full border border-green-400/30 flex items-center gap-1">
               <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"></span>
               Online
             </span>
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6 bg-slate-50/50">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}>
              
              {/* Message Bubble */}
              <div className={`max-w-[90%] p-3 rounded-2xl shadow-sm text-sm ${
                msg.sender === 'user' 
                  ? 'bg-blue-600 text-white rounded-br-none' 
                  : 'bg-white border border-slate-200 text-slate-800 rounded-bl-none'
              }`}>
                {msg.text}
              </div>

              {/* Agent "Brain" Visualization (Thoughts & Actions) */}
              {msg.sender === 'agent' && (msg.thoughts?.length! > 0 || msg.actions?.length! > 0) && (
                <div className="mt-2 ml-1 max-w-[90%] bg-slate-100 rounded-xl border border-slate-200 overflow-hidden">
                  <div className="px-3 py-1.5 bg-slate-200/50 text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                    <Cpu size={10} /> Agent Reasoning
                  </div>
                  <div className="p-3 space-y-3">
                    {/* Internal Monologue */}
                    {msg.thoughts && msg.thoughts.length > 0 && (
                      <div className="space-y-1">
                        {msg.thoughts.map((thought, idx) => (
                          <div key={idx} className="flex items-start gap-2 text-[11px] text-slate-500 font-mono">
                            <span className="text-blue-400 mt-0.5">›</span>
                            {thought}
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {/* System Actions */}
                    {msg.actions && msg.actions.length > 0 && (
                      <div className="space-y-1.5 pt-2 border-t border-slate-200">
                        {msg.actions.map((action, idx) => (
                          <div key={idx} className="flex items-center justify-between bg-white p-1.5 rounded border border-slate-100 shadow-sm">
                            <div className="flex items-center gap-2">
                              {action.type === 'crm_lookup' && <Database size={12} className="text-purple-500"/>}
                              {action.type === 'policy_check' && <Shield size={12} className="text-orange-500"/>}
                              {action.type === 'generate_doc' && <FileText size={12} className="text-blue-500"/>}
                              {action.type === 'teams_ping' && <Users size={12} className="text-indigo-500"/>}
                              <span className="text-[11px] font-medium text-slate-700">{action.label}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              {action.status === 'success' && <CheckCircle size={12} className="text-green-500" />}
                              {action.status === 'warning' && <AlertCircle size={12} className="text-orange-500" />}
                              <span className="text-[9px] text-slate-400 max-w-[80px] truncate">{action.details}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
          
          {isTyping && (
            <div className="flex items-center gap-2 text-slate-400 ml-2">
              <Loader2 size={16} className="animate-spin" />
              <span className="text-xs">Agent is thinking...</span>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-3 bg-white border-t border-slate-200">
          {/* Quick Actions / Suggestions */}
          {messages.length === 1 && (
            <div className="mb-3 flex flex-wrap gap-2">
              <button onClick={() => { setInputValue("Yes, create a draft proposal."); handleSendMessage(); }} 
                className="text-xs bg-blue-50 text-blue-700 px-3 py-1.5 rounded-full border border-blue-100 hover:bg-blue-100 transition-colors">
                ✨ Draft Proposal
              </button>
            </div>
          )}
           {messages.length > 2 && appView === 'drafting_view' && discount === 0 && (
            <div className="mb-3 flex flex-wrap gap-2">
               <button onClick={() => { setInputValue("Apply a 20% discount for them."); handleSendMessage(); }} 
                className="text-xs bg-blue-50 text-blue-700 px-3 py-1.5 rounded-full border border-blue-100 hover:bg-blue-100 transition-colors">
                💰 Apply 20% Discount
              </button>
            </div>
          )}
          {discount > 15 && approvalStatus === 'none' && (
             <div className="mb-3 flex flex-wrap gap-2">
             <button onClick={() => { setInputValue("Request approval from Sarah."); handleSendMessage(); }} 
              className="text-xs bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded-full border border-indigo-100 hover:bg-indigo-100 transition-colors">
              👥 Request Approval
            </button>
          </div>
          )}

          <div className="relative">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder="Tell the agent what to do..."
              className="w-full pl-4 pr-10 py-3 bg-slate-100 border-none rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none text-slate-700"
            />
            <button 
              onClick={handleSendMessage}
              disabled={!inputValue.trim()}
              className="absolute right-2 top-2 p-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Send size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* RIGHT PANEL: Application Context (Simulated M365 Environment) */}
      <div className="flex-1 bg-slate-100 p-6 flex flex-col h-full relative">
        
        {/* App Switcher Tabs (Simulated) */}
        <div className="flex gap-1 mb-4">
          <button 
            onClick={() => setAppView('email_view')}
            className={`px-4 py-2 rounded-t-lg text-sm font-medium flex items-center gap-2 transition-colors ${appView === 'email_view' ? 'bg-white text-blue-600 shadow-sm' : 'bg-slate-200 text-slate-500 hover:bg-slate-300'}`}
          >
            <Mail size={16} /> Outlook
          </button>
          <button 
             onClick={() => setAppView('drafting_view')}
             className={`px-4 py-2 rounded-t-lg text-sm font-medium flex items-center gap-2 transition-colors ${appView === 'drafting_view' ? 'bg-white text-blue-600 shadow-sm' : 'bg-slate-200 text-slate-500 hover:bg-slate-300'}`}
          >
            <FileText size={16} /> Word
          </button>
          <button 
             onClick={() => setAppView('teams_approval_view')}
             className={`px-4 py-2 rounded-t-lg text-sm font-medium flex items-center gap-2 transition-colors ${appView === 'teams_approval_view' ? 'bg-white text-blue-600 shadow-sm' : 'bg-slate-200 text-slate-500 hover:bg-slate-300'}`}
          >
            <Users size={16} /> Teams
          </button>
        </div>

        {/* Workspace Content */}
        <div className="flex-1 bg-white rounded-lg rounded-tl-none shadow-sm overflow-hidden border border-slate-200 relative">
          
          {/* VIEW: Outlook Email */}
          {appView === 'email_view' && (
            <div className="h-full flex flex-col animate-in fade-in duration-300">
              <div className="border-b border-slate-100 p-4 bg-slate-50">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center text-white text-xs font-bold">JD</div>
                    <div>
                      <h3 className="font-semibold text-slate-900 text-sm">John Doe</h3>
                      <p className="text-xs text-slate-500">Acme Corp &lt;john.doe@acme.com&gt;</p>
                    </div>
                  </div>
                  <span className="text-xs text-slate-400">Today, 9:41 AM</span>
                </div>
                <h2 className="text-lg font-semibold text-slate-800">Re: Enterprise License Renewal - 500 Seats</h2>
              </div>
              <div className="p-6 text-slate-700 text-sm leading-relaxed max-w-2xl">
                <p className="mb-4">Hi Alex,</p>
                <p className="mb-4">Thanks for the call yesterday. We're interested in moving forward with the renewal for our 500 seats.</p>
                <p className="mb-4">However, we need to get this finalized by end of week. Can you send over a formal proposal?</p>
                <p className="mb-4">Also, given the volume, we are hoping for some flexibility on the pricing. Let us know what you can do.</p>
                <p>Best,<br/>John</p>
              </div>
              
              {/* Copilot Suggestion Overlay */}
              <div className="absolute bottom-6 right-6">
                <div className="bg-white p-3 rounded-lg shadow-lg border border-blue-100 flex items-center gap-3 animate-bounce-slight cursor-pointer hover:shadow-xl transition-shadow"
                     onClick={() => handleSendMessage()} 
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                    <Bot size={16} className="text-white" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-800">Sales Agent Suggestion</p>
                    <p className="text-[10px] text-slate-500">Draft proposal based on this email?</p>
                  </div>
                  <ChevronRight size={16} className="text-slate-400" />
                </div>
              </div>
            </div>
          )}

          {/* VIEW: Word Document */}
          {appView === 'drafting_view' && (
            <div className="h-full flex flex-col bg-slate-50 animate-in fade-in duration-300">
              {/* Word Toolbar Mock */}
              <div className="h-10 bg-blue-700 flex items-center px-4 gap-4 text-white/90 text-xs">
                <span>File</span>
                <span>Home</span>
                <span>Insert</span>
                <span className="font-bold underline decoration-2 decoration-white/50 underline-offset-4">Copilot</span>
              </div>
              
              {/* Document Canvas */}
              <div className="flex-1 overflow-y-auto p-8 flex justify-center">
                <div className="w-[210mm] min-h-[297mm] bg-white shadow-lg p-[25mm] text-slate-800 text-sm leading-relaxed relative">
                   {/* Watermark if Draft */}
                   {approvalStatus !== 'approved' && discount > 15 && (
                     <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-10 rotate-[-45deg]">
                       <span className="text-8xl font-black text-slate-900">DRAFT</span>
                     </div>
                   )}

                   {proposalContent ? (
                     <div className="font-serif" dangerouslySetInnerHTML={{ __html: proposalContent }} />
                   ) : (
                     <div className="h-full flex flex-col items-center justify-center text-slate-400 gap-3">
                       <Loader2 size={32} className="animate-spin text-blue-200" />
                       <p>Generating document from template...</p>
                     </div>
                   )}
                </div>
              </div>
            </div>
          )}

          {/* VIEW: Teams Approval */}
          {appView === 'teams_approval_view' && (
            <div className="h-full flex flex-col bg-white animate-in fade-in duration-300">
               <div className="h-12 border-b border-slate-100 flex items-center px-4 justify-between bg-indigo-50/30">
                 <div className="flex items-center gap-2">
                   <Users size={18} className="text-indigo-600"/>
                   <span className="font-semibold text-sm text-slate-700">Chat with Sarah Jenkins (VP)</span>
                 </div>
               </div>
               
               <div className="flex-1 p-6 space-y-6">
                 {/* Adaptive Card Simulation */}
                 <div className="max-w-md bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden ml-auto">
                    <div className="bg-slate-50 p-3 border-b border-slate-100 flex items-center gap-2">
                       <Bot size={16} className="text-blue-600"/>
                       <span className="text-xs font-semibold text-slate-600">Northstar Agent requesting approval</span>
                    </div>
                    <div className="p-4 space-y-3">
                       <h3 className="font-bold text-slate-800 text-sm">Discount Approval Needed</h3>
                       <div className="text-xs text-slate-600 space-y-1">
                         <div className="flex justify-between"><span>Client:</span> <span className="font-medium">Acme Corp</span></div>
                         <div className="flex justify-between"><span>Deal Size:</span> <span className="font-medium">$150,000</span></div>
                         <div className="flex justify-between"><span>Requested Discount:</span> <span className="font-medium text-orange-600">20%</span></div>
                         <div className="flex justify-between"><span>Policy Limit:</span> <span className="font-medium">15%</span></div>
                       </div>
                       <div className="p-2 bg-yellow-50 text-yellow-800 text-[10px] rounded border border-yellow-100">
                         <strong>Justification:</strong> Renewal of 500 seats. Client requested flexibility due to volume.
                       </div>
                    </div>
                    <div className="p-3 bg-slate-50 border-t border-slate-100 flex gap-2">
                       {approvalStatus === 'pending' ? (
                          <>
                            <button className="flex-1 py-1.5 bg-white border border-slate-300 rounded text-xs font-medium text-slate-400 cursor-not-allowed">Approve</button>
                            <button className="flex-1 py-1.5 bg-white border border-slate-300 rounded text-xs font-medium text-slate-400 cursor-not-allowed">Reject</button>
                            <span className="flex items-center gap-1 text-[10px] text-slate-400">
                              <Loader2 size={10} className="animate-spin" /> Awaiting response
                            </span>
                          </>
                       ) : (
                          <div className="w-full py-1.5 bg-green-100 text-green-700 text-xs font-bold text-center rounded border border-green-200 flex items-center justify-center gap-2">
                            <CheckCircle size={12}/> Approved by Sarah Jenkins
                          </div>
                       )}
                    </div>
                 </div>
               </div>
            </div>
          )}

        </div>
      </div>

    </div>
  );
}