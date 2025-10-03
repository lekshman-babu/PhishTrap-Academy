import React, { useState, useEffect } from 'react';
import { Shield, Trophy, Zap, Target, Crosshair, Mail, User, ArrowLeft, CheckCircle, XCircle, Crown, Lightbulb, X, UserPlus, Send, TrendingUp, TrendingDown, AlertTriangle } from 'lucide-react';

const mockAPI = {
  players: [],
  nextPlayerId: 1,
  registerPlayer: async (nickname) => {
    await new Promise(resolve => setTimeout(resolve, 500));
    const player = { player_id: mockAPI.nextPlayerId++, nickname, total_points: 0, xp: 0, level: 1 };
    mockAPI.players.push(player);
    return player;
  },
  getLeaderboard: async () => {
    await new Promise(resolve => setTimeout(resolve, 300));
    return mockAPI.players.sort((a, b) => b.total_points - a.total_points).slice(0, 10);
  }
};

const scenarios = [
  { id: "s1", type: "phishing", sender: "security-team@account-verify-center.com", subject: "Security Alert: Verify your account", body: "We detected unusual activity on your account from an IP address in Russia. Your account has been temporarily locked for your protection. Please verify your identity within 12 hours to restore access. Click the secure verification link below to confirm your account details and prevent permanent suspension.", target_tokens: ["unusual activity", "temporarily locked", "within 12 hours", "permanent suspension"], explanation: "Sophisticated phishing using security concerns and foreign threat narrative. The domain 'account-verify-center.com' is not official. Real companies specify which service and use official domains." },
  { id: "s2", type: "legitimate", sender: "notifications@linkedin.com", subject: "Sarah Chen viewed your profile", body: "Sarah Chen, Senior Product Manager at Tech Corp, viewed your LinkedIn profile. See who else has viewed your profile this week. You can adjust your privacy settings at any time in your account preferences.", target_tokens: [], explanation: "Legitimate LinkedIn notification from official domain with specific information and no urgent demands." },
  { id: "s3", type: "phishing", sender: "support@apple-icloud-security.com", subject: "iCloud Storage Full - Immediate Action Required", body: "Your iCloud storage is 100% full. Your photos and important data will be permanently deleted in 48 hours unless you upgrade your storage plan immediately. We're offering a limited-time discount of 50% off for the next 24 hours. Click here to upgrade now and protect your memories. After 48 hours, deleted data cannot be recovered.", target_tokens: ["100% full", "permanently deleted", "in 48 hours", "immediately", "limited-time"], explanation: "Creates panic about data loss with fake urgency and time pressure. Real Apple emails come from @apple.com or @icloud.com only, not 'apple-icloud-security.com'. Apple gives ample warning before data deletion." },
  { id: "s4", type: "phishing", sender: "billing@stripe-payments-secure.net", subject: "Unusual charge detected: $1,247.99", body: "We've detected an unusual charge of $1,247.99 on your account for a MacBook Pro purchase. This transaction was flagged by our fraud detection system as it originates from a device we don't recognize in Lagos, Nigeria. If you did not authorize this purchase, you must dispute it within the next 6 hours or the charge will be finalized and cannot be reversed. Click here to review transaction details and cancel if fraudulent. Transaction ID: SPE-48291-NGR-2024. For immediate assistance, call our fraud hotline at +1-888-555-0199.", target_tokens: ["Unusual charge", "fraud detection", "within the next 6 hours", "cannot be reversed", "call"], explanation: "Advanced phishing using payment fraud anxiety with specific dollar amount and foreign location to trigger panic. The domain 'stripe-payments-secure.net' is fake - Stripe uses @stripe.com. Legitimate companies don't require 6-hour response windows." },
  { id: "s5", type: "legitimate", sender: "no-reply@github.com", subject: "Successful sign-in from new device", body: "A new sign-in to your GitHub account occurred from Chrome on Windows 11. Location: Seattle, Washington, United States. IP address: 52.123.45.67. Time: October 3, 2024 at 2:15 PM PDT. If this was you, no action is needed. If you don't recognize this activity, please secure your account immediately at github.com/settings/security and review your recent activity. You can also enable two-factor authentication for additional security.", target_tokens: [], explanation: "Legitimate security notification with specific details (device, OS, location, IP, time), official GitHub domain, and helpful security recommendations without forcing action." },
  { id: "s6", type: "phishing", sender: "no-reply@microsoft-account-services.com", subject: "Your Microsoft 365 subscription expires today", body: "Your Microsoft 365 Family subscription will expire at 11:59 PM tonight. To avoid losing access to Word, Excel, PowerPoint, and 1TB of OneDrive storage, you must renew immediately. We're currently offering a special renewal rate of $89.99/year (save $30). Click here to renew now and maintain uninterrupted access to all your files and applications. If you don't renew today, your subscription will be cancelled and your OneDrive files will be deleted after 90 days.", target_tokens: ["expires today", "11:59 PM tonight", "must renew immediately", "will be deleted"], explanation: "Creates false urgency with today's expiration deadline. The domain 'microsoft-account-services.com' looks official but isn't - Microsoft uses @microsoft.com. Real subscription notices come well in advance, and files aren't deleted immediately." },
  { id: "s7", type: "legitimate", sender: "do-not-reply@amazon.com", subject: "Your Amazon.com order has shipped", body: "Hello Vijay, Your order #112-8847392-4728394 has shipped! Track your package: Apple AirPods Pro (2nd Gen) - Arriving Saturday, October 5. Carrier: UPS, Tracking: 1Z999AA10123456784. View or manage your order in Your Orders. Questions? Visit our Help section or contact Customer Service. Thanks for shopping with us!", target_tokens: [], explanation: "Legitimate Amazon shipping confirmation from official @amazon.com domain with specific order number, tracking info, and no urgent demands." },
  { id: "s8", type: "phishing", sender: "security-alerts@accounts-google-verify.com", subject: "Critical: 3 failed sign-in attempts detected", body: "We've detected 3 consecutive failed login attempts to your Google account from an unrecognized Android device in Beijing, China within the last 30 minutes. This may indicate someone has obtained your password and is attempting to access your account. For your security, we've temporarily restricted account access. You must verify your identity now to prevent permanent account suspension. Please provide the following information: Current password, Recovery email address, Phone number for verification code, Date of account creation. Click here to complete emergency verification. This security check expires in 2 hours. If you don't complete verification, your account will be permanently disabled to prevent unauthorized access.", target_tokens: ["3 failed", "temporarily restricted", "permanent account suspension", "expires in 2 hours", "permanently disabled"], explanation: "Sophisticated phishing with specific threat details (3 attempts, Beijing, time frame). The domain 'accounts-google-verify.com' is fake - Google uses @google.com or @accounts.google.com. Google NEVER asks for your current password via email." },
  { id: "s9", type: "phishing", sender: "hr-department@company-portal-services.net", subject: "MANDATORY: Annual Security Awareness Training - Due Today", body: "All employees must complete the Annual Cybersecurity Awareness Training by 5:00 PM today, October 3, 2024. This is a compliance requirement mandated by our IT Security Policy. Failure to complete this training by the deadline will result in: Immediate suspension of network access, Email account deactivation, HR disciplinary action up to and including termination. The training takes approximately 45 minutes. Click here to access your personalized training module. Your completion status is currently: NOT STARTED. You are one of 23 employees who have not yet completed this mandatory training. This is your final reminder. Questions? Contact IT Security at extension 4500.", target_tokens: ["MANDATORY", "Due Today", "5:00 PM today", "Immediate suspension", "termination"], explanation: "Corporate spear-phishing using authority, compliance language, and threat of job loss. The domain 'company-portal-services.net' is suspicious. Real HR gives advance notice for mandatory training and uses internal learning platforms, not external links in emails." },
  { id: "s10", type: "legitimate", sender: "notify@twitter.com", subject: "New follower: @TechIndustryNews", body: "TechIndustryNews (@TechIndustryNews) is now following you on Twitter! Bio: Breaking news and analysis from the tech industry. 150K followers. See their profile and tweets. You can manage your follower notifications in Settings. Turn off these emails anytime.", target_tokens: [], explanation: "Legitimate Twitter notification from official domain. Provides context about the follower and optional actions without any urgency or pressure." },
  { id: "s11", type: "phishing", sender: "support@amazon-security-dept.com", subject: "Unauthorized order placed - $897.45 - URGENT", body: "FRAUD ALERT: We've detected a suspicious order placed on your Amazon account that does not match your typical purchase pattern. Order Details: Item: Sony PlayStation 5 Digital Edition, Price: $897.45, Shipping address: 742 Evergreen Terrace, Springfield (NOT your registered address), Payment method: Visa ending in 8834, Estimated delivery: October 6, 2024. This order was placed 15 minutes ago from an IP address in Philippines that we don't recognize. If you did NOT place this order, you must cancel it immediately by clicking the link below and verifying your account information. YOU HAVE ONLY 1 HOUR to cancel this order before it ships. Once shipped, returns are subject to a 35% restocking fee. To cancel and secure your account, we need you to: Confirm your current password, Verify the last 4 digits of your payment methods, Update your security questions. Our fraud prevention team is standing by 24/7. Order number: 174-9284728-8927463. URGENT: Respond within 60 minutes or this order will be processed.", target_tokens: ["FRAUD ALERT", "15 minutes ago", "ONLY 1 HOUR", "URGENT", "60 minutes"], explanation: "Sophisticated Amazon impersonation with realistic order details and multiple urgency tactics. The domain 'amazon-security-dept.com' is fake - Amazon uses only @amazon.com. Amazon never asks for passwords via email, and the 1-hour cancellation window is fabricated pressure." },
  { id: "s12", type: "legitimate", sender: "no-reply@steampowered.com", subject: "Steam Guard: New login from Chrome on Windows", body: "Hi there, Someone just logged into your Steam account from a new device. If this was you, you can safely ignore this email. Device: Chrome browser on Windows 11, Location: Tempe, Arizona, United States (approximate), Date: Friday, October 3, 2024 at 1:30 PM MST. If you don't recognize this login, please secure your account at help.steampowered.com/wizard/Login. We recommend changing your password and ensuring Steam Guard is enabled. Need help? Visit our Support site at help.steampowered.com. The Steam Team", target_tokens: [], explanation: "Legitimate Steam security alert from official @steampowered.com domain with specific login details. Provides helpful guidance without forcing immediate action or asking for sensitive information." },
  { id: "s13", type: "phishing", sender: "payroll-services@company-benefits-portal.org", subject: "URGENT: Direct Deposit Verification Required - Paycheck at Risk", body: "ATTENTION ALL EMPLOYEES: Our payroll system is undergoing a mandatory security upgrade to comply with new federal banking regulations. ALL employees must re-verify their direct deposit information by 11:59 PM tonight, October 3, 2024, or your next paycheck (scheduled for October 15) will be DELAYED by up to 4 weeks and issued as a paper check. This is NOT optional. The IRS and Department of Labor require this verification for tax compliance and fraud prevention. To avoid paycheck delays, please verify your information immediately by clicking the secure link below. Required information for verification: Full legal name (as it appears on your Social Security card), Social Security Number (complete 9 digits), Date of birth, Current bank name, Bank routing number (9 digits), Bank account number, Upload a voided check or bank statement (PDF or image). This verification link expires at midnight tonight. After midnight, you will need to complete manual paperwork through HR, which takes 3-5 business days to process and will cause significant delays in payment. Your cooperation is required by both company policy and federal law. If you experience technical difficulties, contact emergency payroll support at payroll-help@company-benefits-portal.org. VERIFY NOW to ensure you receive your paycheck on time. Employee Services Department", target_tokens: ["URGENT", "11:59 PM tonight", "DELAYED by up to 4 weeks", "Social Security Number", "complete 9 digits", "expires at midnight"], explanation: "Highly sophisticated corporate phishing targeting employee payroll anxiety. Uses fake federal compliance claims, threatens paycheck delays, and requests complete SSN. Real HR departments NEVER ask for full SSN via email and provide much more notice for system changes. The domain 'company-benefits-portal.org' is fraudulent." },
  { id: "s14", type: "legitimate", sender: "noreply@spotify.com", subject: "Your Spotify Premium payment was successful", body: "Thanks for your payment! Your Spotify Premium subscription has been renewed. Amount charged: $10.99, Payment method: Visa ending in 4829, Next billing date: November 3, 2024. Manage your subscription or update payment info at spotify.com/account. Enjoying Premium? Check out our new personalized playlists and podcast recommendations. Questions? Visit spotify.com/support. Happy listening! The Spotify Team", target_tokens: [], explanation: "Legitimate payment confirmation from official @spotify.com domain. Clear transaction details with no urgent demands or requests for additional information." },
  { id: "s15", type: "phishing", sender: "tax-services@irs-refund-processing.us", subject: "IRS OFFICIAL NOTICE: Tax Refund Approval #2024-RTF-89347", body: "UNITED STATES INTERNAL REVENUE SERVICE, Department of the Treasury, 1111 Constitution Ave NW, Washington, DC 20224. OFFICIAL TAX REFUND NOTICE - Reference Number: RTF-2024-89347. Dear Taxpayer (SSN ending in ****), After an automated review of your 2023 Federal Tax Return (Form 1040), our systems have identified a calculation error in your favor. You are entitled to an additional tax refund of $2,847.00. This refund was approved on September 28, 2024, by the IRS Automated Refund Processing System. To claim your refund, you must complete identity verification within 72 hours of receiving this notice. After 72 hours, this refund approval will expire and you will need to file an amended return (Form 1040-X) to claim it, which can take 16-20 weeks to process. IMMEDIATE ACTION REQUIRED: Click here to access the IRS Secure Taxpayer Verification Portal, Verify your identity using the information below, Your refund will be processed within 3-5 business days after verification. Required Information for Identity Verification: Full Social Security Number (all 9 digits), Date of birth, Current mailing address, Bank account number and routing number for direct deposit, Driver's license or state ID number, Copy of most recent pay stub or W-2 form (upload). This verification process is mandated by IRS Publication 4803 and the Identity Protection Personal Identification Number (IP PIN) program. Security Notice: The IRS will never ask for this information via phone call, but email verification is standard procedure for refund amounts over $1,000 as required by the Protecting Americans from Tax Hikes (PATH) Act. For questions regarding this refund, contact the IRS Refund Inquiry Hotline at 1-800-829-0922 (note: this is not the official IRS number - the real number is different). Do not reply to this email as this mailbox is not monitored. All responses must be submitted through the secure portal. Important: This is an official IRS communication. Failure to respond will result in forfeiture of your refund. Reference Number: RTF-2024-89347. Sincerely, Internal Revenue Service, United States Department of the Treasury", target_tokens: ["calculation error", "within 72 hours", "expire", "Social Security Number (all 9 digits)", "Driver's license", "IMMEDIATE ACTION REQUIRED"], explanation: "Extremely sophisticated IRS impersonation scam with official formatting, reference numbers, and legal citations. The domain 'irs-refund-processing.us' is fake - the IRS only uses @irs.gov. CRITICAL: The IRS NEVER initiates contact about refunds via email, NEVER asks for complete SSN or bank info via email, and doesn't have 72-hour deadlines for refund claims." }
];

const phishingFacts = [
  "Examine sender addresses carefully: Phishers use lookalike domains like 'paypa1.com' instead of 'paypal.com' or 'support@amaz0n.com' with a zero instead of 'o'",
  "Hover before you click: Position your mouse over any link without clicking to reveal the actual destination URL in the bottom corner of your browser",
  "Urgency is a red flag: Phrases like 'Act now!', 'Within 24 hours', or 'Account will be suspended' are psychological manipulation tactics to bypass your critical thinking",
  "No legitimate company requests passwords via email: Banks, payment processors, and reputable services will NEVER ask you to provide or confirm passwords through email",
  "Generic greetings reveal mass emails: Real companies use your actual name. 'Dear Customer', 'Valued Member', or 'Account Holder' indicate automated phishing campaigns",
  "Grammar and spelling errors are warning signs: Professional companies employ editors. Multiple typos, awkward phrasing, or poor grammar often indicate scams",
  "Unexpected attachments are dangerous: Even from known contacts, verify through another channel before opening. Attachments can contain ransomware, keyloggers, or trojans",
  "Verify through official channels only: If an email claims to be from your bank, call the number on your card or their official website - never use contact info from the suspicious email",
  "HTTPS and padlock icons aren't guarantees: Scammers can obtain SSL certificates too. A secure connection doesn't mean the site itself is legitimate or safe",
  "Fear and urgency override logic: Scammers exploit emotions. If you feel panicked or pressured to act immediately, that's the moment to slow down and verify",
  "Official domains vs free email services: Legitimate businesses use company domains (@company.com), not Gmail, Yahoo, or Hotmail for official business communications",
  "Too good to be true always is: Unexpected prizes, inheritances from unknown relatives, or job offers requiring upfront payment are always scams - no exceptions",
  "Reply-to addresses often differ from sender: Check the 'Reply-To' field. Phishers display one address but replies go to a completely different, suspicious address",
  "Gift cards and wire transfers are scam payment methods: No legitimate business, government agency, or tech support asks for payment via gift cards, Bitcoin, or Western Union",
  "Enable multi-factor authentication everywhere: MFA adds a critical second barrier. Even if your password is compromised, attackers can't access your account without the second factor"
];

const styles = {
  app: { minHeight: '100vh', background: 'linear-gradient(135deg, #1e293b 0%, #4c1d95 50%, #1e293b 100%)', color: 'white', fontFamily: 'system-ui, sans-serif' },
  header: { borderBottom: '1px solid rgba(168, 85, 247, 0.3)', padding: '1rem', background: 'rgba(15, 23, 42, 0.5)' },
  headerContent: { maxWidth: '80rem', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  main: { maxWidth: '80rem', margin: '0 auto', padding: '2rem 1rem' },
  card: { background: 'rgba(30, 41, 59, 0.5)', border: '1px solid rgba(168, 85, 247, 0.3)', borderRadius: '1rem', padding: '2rem' },
  button: { width: '100%', padding: '1rem', background: 'linear-gradient(to right, #06b6d4, #7c3aed)', color: 'white', fontWeight: 'bold', borderRadius: '0.75rem', border: 'none', cursor: 'pointer', fontSize: '1rem' },
  input: { width: '100%', padding: '0.75rem 1rem', background: 'rgba(15, 23, 42, 0.5)', border: '1px solid rgba(168, 85, 247, 0.3)', borderRadius: '0.75rem', color: 'white', fontSize: '1rem' },
  textarea: { width: '100%', padding: '0.75rem 1rem', background: 'rgba(15, 23, 42, 0.5)', border: '1px solid rgba(168, 85, 247, 0.3)', borderRadius: '0.75rem', color: 'white', fontSize: '1rem', minHeight: '150px', resize: 'vertical', fontFamily: 'inherit' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', marginTop: '2rem' },
  gameCard: { background: 'rgba(30, 41, 59, 0.5)', border: '1px solid rgba(168, 85, 247, 0.3)', borderRadius: '1rem', padding: '2rem', textAlign: 'center', cursor: 'pointer', transition: 'transform 0.2s' },
  token: { display: 'inline-block', padding: '0.25rem 0.5rem', margin: '0.25rem', borderRadius: '0.25rem', cursor: 'pointer', transition: 'all 0.2s' },
  footer: { borderTop: '1px solid rgba(168, 85, 247, 0.3)', padding: '1.5rem', textAlign: 'center', marginTop: '5rem', background: 'rgba(15, 23, 42, 0.5)' }
};

const Register = ({ onRegister, isAnimating }) => {
  const [nickname, setNickname] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (nickname.length < 2 || nickname.length > 20) { setError('Nickname must be 2-20 characters'); return; }
    setLoading(true);
    try {
      const player = await mockAPI.registerPlayer(nickname);
      onRegister(player);
    } catch (err) {
      setError('Registration failed');
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem 1rem' }}>
      <div style={{ width: '100%', maxWidth: '28rem' }}>
        <div style={{ 
          textAlign: 'center', 
          marginBottom: '2rem',
          transform: isAnimating ? 'translateY(-400px) scale(0.6)' : 'translateY(0) scale(1)',
          transition: 'all 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
          opacity: isAnimating ? 0 : 1
        }}>
          <div style={{ display: 'inline-block', padding: '1rem', background: 'rgba(34, 211, 238, 0.2)', borderRadius: '50%', marginBottom: '1rem' }}><Shield size={64} color="#22d3ee" /></div>
          <h2 style={{ fontSize: '2.5rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>PhishTrap Academy</h2>
          <p style={{ color: '#c4b5fd' }}>Master phishing detection</p>
        </div>
        <div style={{
          ...styles.card,
          transform: isAnimating ? 'scale(0.9)' : 'scale(1)',
          opacity: isAnimating ? 0 : 1,
          transition: 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)'
        }}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', color: '#c4b5fd', marginBottom: '0.5rem' }}>Nickname</label>
              <input type="text" value={nickname} onChange={(e) => setNickname(e.target.value)} placeholder="2-20 characters" style={styles.input} maxLength={20} disabled={loading} />
              <p style={{ marginTop: '0.25rem', fontSize: '0.75rem', color: '#c4b5fd' }}>{nickname.length}/20</p>
            </div>
            {error && <div style={{ padding: '0.75rem', background: 'rgba(239, 68, 68, 0.2)', border: '1px solid rgba(239, 68, 68, 0.5)', borderRadius: '0.5rem', color: '#fca5a5', fontSize: '0.875rem' }}>{error}</div>}
            <button type="submit" disabled={loading} style={styles.button}>{loading ? 'Creating...' : 'Start Training'}</button>
          </form>
        </div>
      </div>
    </div>
  );
};

const GameMenu = ({ onSelectGame }) => {
  const [currentFactIndex, setCurrentFactIndex] = useState(0);
  const [fade, setFade] = useState(true);

  useEffect(() => {
    let timeoutId;
    const interval = setInterval(() => {
      setFade(false);
      timeoutId = setTimeout(() => {
        setCurrentFactIndex((prev) => (prev + 1) % phishingFacts.length);
        setFade(true);
      }, 300);
    }, 7000);
    return () => {
      clearInterval(interval);
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, []);

  const games = [
    { id: 'spot', title: 'Spot-3', icon: Target, color: '#06b6d4' },
    { id: 'battle', title: 'Cyber Arena', icon: Shield, color: '#a855f7' },
    { id: 'leaderboard', title: 'Leaderboard', icon: Crown, color: '#f59e0b' }
  ];

  return (
    <div style={{ maxWidth: '64rem', margin: '0 auto' }}>
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}><h2 style={{ fontSize: '2.5rem', fontWeight: 'bold' }}>Choose Mode</h2></div>
      <div style={styles.grid}>
        {games.map((game) => {
          const Icon = game.icon;
          return (
            <div key={game.id} onClick={() => onSelectGame(game.id)} style={styles.gameCard} onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'} onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}>
              <div style={{ width: '4rem', height: '4rem', background: game.color, borderRadius: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}><Icon size={32} color="white" /></div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>{game.title}</h3>
            </div>
          );
        })}
      </div>
      
      <div style={{ maxWidth: '48rem', margin: '4rem auto 0' }}>
        <div style={{ background: 'linear-gradient(to right, rgba(6, 182, 212, 0.1), rgba(124, 58, 237, 0.1))', backdropFilter: 'blur(16px)', borderRadius: '1rem', border: '1px solid rgba(34, 211, 238, 0.3)', padding: '2rem', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3)' }}>
          <div style={{ display: 'flex', alignItems: 'start', gap: '1rem' }}>
            <Lightbulb size={32} color="#22d3ee" style={{ flexShrink: 0, marginTop: '0.25rem' }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '0.875rem', fontWeight: 'bold', color: '#22d3ee', marginBottom: '1rem' }}>SECURITY TIP</div>
              <p style={{ fontSize: '1rem', color: 'white', lineHeight: '1.6', opacity: fade ? 1 : 0, transition: 'opacity 0.3s' }}>{phishingFacts[currentFactIndex]}</p>
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '0.25rem', marginTop: '1.5rem' }}>
            {phishingFacts.map((_, idx) => (
              <div key={idx} style={{ width: '0.5rem', height: '0.5rem', borderRadius: '50%', background: idx === currentFactIndex ? '#22d3ee' : 'rgba(255, 255, 255, 0.3)', transition: 'all 0.3s' }} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const BattleMode = ({ onBack, onUpdateStats }) => {
  const [mode, setMode] = useState('defense');
  const [scenario, setScenario] = useState(scenarios[0]);
  const [result, setResult] = useState(null);
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');

  const loadNew = () => { setScenario(scenarios[Math.floor(Math.random() * scenarios.length)]); setResult(null); setSubject(''); setBody(''); };
  const toggleMode = () => { setMode(prev => prev === 'attack' ? 'defense' : 'attack'); setResult(null); setSubject(''); setBody(''); };

  const submitDefense = (answer) => {
    const correct = answer === scenario.type;
    const points = correct ? 150 : 0;
    setResult({ correct, answer: scenario.type, points, xp: Math.floor(points * 0.7), explanation: scenario.explanation, mode: 'defense' });
    onUpdateStats(points, Math.floor(points * 0.7));
  };

  const submitAttack = () => {
    if (!subject.trim() || !body.trim()) return;
    
    const urgencyWords = ['urgent', 'immediately', 'asap', 'now', 'deadline', 'expires', 'limited time', 'act now', 'hurry', 'final notice'];
    const credentialWords = ['password', 'verify', 'confirm', 'account', 'suspended', 'login', 'username', 'update payment', 'security alert', 'unusual activity'];
    const suspiciousWords = ['click here', 'congratulations', 'winner', 'prize', 'inheritance', 'tax refund', 'act immediately', 'suspended account'];
    
    const allCaps = (body.match(/\b[A-Z]{4,}\b/g) || []).length;
    const exclamationMarks = (subject + body).split('!').length - 1;
    
    const urgencyScore = urgencyWords.filter(w => (subject + body).toLowerCase().includes(w)).length;
    const credentialScore = credentialWords.filter(w => (subject + body).toLowerCase().includes(w)).length;
    const suspiciousScore = suspiciousWords.filter(w => (subject + body).toLowerCase().includes(w)).length;
    
    const threatScore = Math.min(1, 
      (urgencyScore * 0.12) + 
      (credentialScore * 0.18) + 
      (suspiciousScore * 0.15) + 
      (allCaps * 0.08) + 
      (exclamationMarks * 0.05)
    );
    
    const points = Math.max(30, Math.floor((1 - threatScore) * 200));
    const xp = Math.floor(points * 0.7);
    
    const triggers = [];
    if (urgencyScore > 0) triggers.push(`Urgency indicators: ${urgencyScore}`);
    if (credentialScore > 0) triggers.push(`Credential requests: ${credentialScore}`);
    if (suspiciousScore > 0) triggers.push(`Suspicious phrases: ${suspiciousScore}`);
    if (allCaps > 2) triggers.push(`Excessive caps: ${allCaps}`);
    if (exclamationMarks > 3) triggers.push(`Excessive punctuation: ${exclamationMarks}!`);
    
    setResult({ 
      points, 
      xp, 
      threatScore: Math.round(threatScore * 100), 
      triggers, 
      mode: 'attack', 
      detectability: threatScore < 0.25 ? 'Hard to Detect' : threatScore < 0.5 ? 'Moderate' : threatScore < 0.75 ? 'Easy to Detect' : 'Very Obvious'
    });
    onUpdateStats(points, xp);
  };

  return (
    <div style={{ maxWidth: '64rem', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
        <button onClick={onBack} style={{ padding: '0.5rem 1rem', background: 'rgba(30, 41, 59, 0.5)', border: 'none', borderRadius: '0.5rem', color: 'white', cursor: 'pointer', display: 'flex', gap: '0.5rem' }}><ArrowLeft size={16} />Back</button>
        <div style={{ display: 'flex', background: 'rgba(30, 41, 59, 0.5)', borderRadius: '0.75rem', padding: '0.25rem' }}>
          <button onClick={toggleMode} style={{ padding: '0.5rem 1.5rem', background: mode === 'defense' ? 'linear-gradient(to right, #10b981, #059669)' : 'transparent', border: 'none', borderRadius: '0.5rem', color: 'white', cursor: 'pointer', fontWeight: 'bold', display: 'flex', gap: '0.5rem' }}><Shield size={18} />Defense</button>
          <button onClick={toggleMode} style={{ padding: '0.5rem 1.5rem', background: mode === 'attack' ? 'linear-gradient(to right, #a855f7, #ec4899)' : 'transparent', border: 'none', borderRadius: '0.5rem', color: 'white', cursor: 'pointer', fontWeight: 'bold', display: 'flex', gap: '0.5rem' }}><Crosshair size={18} />Attack</button>
        </div>
      </div>

      {mode === 'defense' ? (
        <>
          <div style={styles.card}><p style={{ fontSize: '0.75rem', color: '#c4b5fd' }}>From: {scenario.sender}</p><p style={{ fontWeight: 'bold' }}>Subject: {scenario.subject}</p><div style={{ borderTop: '1px solid rgba(168, 85, 247, 0.3)', paddingTop: '1rem', marginTop: '1rem' }}>{scenario.body}</div></div>
          {!result && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1.5rem' }}>
              <button onClick={() => submitDefense('phishing')} style={{ padding: '2rem', background: 'rgba(239, 68, 68, 0.2)', border: '1px solid rgba(239, 68, 68, 0.5)', borderRadius: '1rem', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}><XCircle size={48} color="#f87171" /><span style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>Phishing</span></button>
              <button onClick={() => submitDefense('legitimate')} style={{ padding: '2rem', background: 'rgba(16, 185, 129, 0.2)', border: '1px solid rgba(16, 185, 129, 0.5)', borderRadius: '1rem', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}><CheckCircle size={48} color="#34d399" /><span style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>Legitimate</span></button>
            </div>
          )}
        </>
      ) : (
        <>
          <div style={{ ...styles.card, marginBottom: '1rem' }}>
            <label style={{ display: 'block', fontSize: '0.875rem', color: '#c4b5fd', marginBottom: '0.5rem' }}>Subject</label>
            <input type="text" value={subject} onChange={(e) => setSubject(e.target.value)} style={styles.input} maxLength={200} disabled={!!result} />
          </div>
          <div style={{ ...styles.card, marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', fontSize: '0.875rem', color: '#c4b5fd', marginBottom: '0.5rem' }}>Body</label>
            <textarea value={body} onChange={(e) => setBody(e.target.value)} style={styles.textarea} maxLength={2000} disabled={!!result} />
          </div>
          {!result && <button onClick={submitAttack} disabled={!subject.trim() || !body.trim()} style={{ ...styles.button, background: 'linear-gradient(to right, #a855f7, #ec4899)', opacity: (!subject.trim() || !body.trim()) ? 0.5 : 1, display: 'flex', justifyContent: 'center', gap: '0.5rem' }}><Send size={20} />Submit</button>}
        </>
      )}

      {result && (
        <div style={{ marginTop: '1.5rem' }}>
          <div style={{ ...styles.card, background: result.mode === 'defense' ? (result.correct ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)') : (result.threatScore < 50 ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)') }}>
            {result.mode === 'defense' ? (
              <><div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{result.correct ? 'Correct!' : 'Incorrect'}</div><p style={{ color: '#c4b5fd', marginTop: '1rem' }}>{result.explanation}</p><div style={{ marginTop: '1rem', textAlign: 'center' }}><Trophy size={20} color="#fbbf24" style={{ display: 'inline' }} /><span style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#fbbf24', marginLeft: '0.5rem' }}>+{result.points}</span></div></>
            ) : (
              <><div><div style={{ fontSize: '2rem', fontWeight: 'bold' }}>{result.threatScore}%</div><div style={{ fontSize: '0.875rem', color: '#c4b5fd' }}>{result.detectability}</div></div><div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}><div><Trophy size={24} color="#fbbf24" /><div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#fbbf24' }}>+{result.points}</div></div><div><Zap size={24} color="#22d3ee" /><div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#22d3ee' }}>+{result.xp}</div></div></div>{result.triggers.length > 0 && <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid rgba(168, 85, 247, 0.3)' }}>{result.triggers.map((t, i) => <div key={i} style={{ fontSize: '0.875rem', color: '#c4b5fd' }}>• {t}</div>)}</div>}</>
            )}
          </div>
          <button onClick={loadNew} style={{ ...styles.button, marginTop: '1rem', background: result.mode === 'defense' ? 'linear-gradient(to right, #10b981, #059669)' : 'linear-gradient(to right, #a855f7, #ec4899)' }}>Next</button>
        </div>
      )}
    </div>
  );
};

const SpotGame = ({ onBack, onUpdateStats }) => {
  // Local, short spotScenarios just for Spot Game (2 examples)
  const spotScenarios = [
    {
      id: "sg1", sender: "it-alerts@example.com", subject: "Security check",
      body: `Hi team,
This is an urgent security check
Please verify your password at the link`,
      target_tokens: ["urgent", "verify", "link"]
    },
    {
      id: "sg2", sender: "support@example.com", subject: "Password reset",
      body: `Dear user,
We noticed unusual activity
act now to reset your password here`,
      target_tokens: ["unusual", "act", "reset"]
    }
  ];
  const [scenario, setScenario] = useState(spotScenarios[0]);
  const [selected, setSelected] = useState([]);
  const [result, setResult] = useState(null);

  const loadNew = () => { setScenario(spotScenarios[Math.floor(Math.random() * spotScenarios.length)]); setSelected([]); setResult(null); };
  const toggleToken = (token) => { if (result) return; if (selected.includes(token)) { setSelected(selected.filter(t => t !== token)); } else if (selected.length < 3) { setSelected([...selected, token]); } };
  const submit = () => { const correct = selected.filter(t => scenario.target_tokens.some(tt => t.toLowerCase().includes(tt))).length; const points = Math.max(0, Math.floor((correct / scenario.target_tokens.length) * 200)); setResult({ correct, points, xp: Math.floor(points * 0.7) }); onUpdateStats(points, Math.floor(points * 0.7)); };
  const tokens = scenario.body.split(/(\s+)/).filter(t => t.trim());

  return (
    <div style={{ maxWidth: '64rem', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
        <button onClick={onBack} style={{ padding: '0.5rem 1rem', background: 'rgba(30, 41, 59, 0.5)', border: 'none', borderRadius: '0.5rem', color: 'white', cursor: 'pointer', display: 'flex', gap: '0.5rem' }}><ArrowLeft size={16} />Back</button>
        <div style={{ color: '#22d3ee', fontWeight: 'bold' }}>{selected.length}/3</div>
      </div>
      <div style={styles.card}>
        <p style={{ fontSize: '0.75rem', color: '#c4b5fd' }}>From: {scenario.sender}</p>
        <p style={{ fontWeight: 'bold' }}>Subject: {scenario.subject}</p>
        <div style={{ borderTop: '1px solid rgba(168, 85, 247, 0.3)', paddingTop: '1rem', marginTop: '1rem' }}>
          {tokens.map((token, i) => (
            <span
              key={i}
              onClick={() => toggleToken(token)}
              style={{
                ...styles.token,
                background: selected.includes(token) ? 'rgba(34, 211, 238, 0.3)' : 'transparent',
                border: selected.includes(token) ? '1px solid #22d3ee' : '1px solid transparent'
              }}
            >
              {token}
            </span>
          ))}
        </div>
      </div>
      {!result && (
        <button
          onClick={submit}
          disabled={selected.length === 0}
          style={{ ...styles.button, marginTop: '1.5rem', opacity: selected.length === 0 ? 0.5 : 1 }}
        >
          Submit
        </button>
      )}
      {result && (
        <div style={{ marginTop: '1.5rem' }}>
          <div style={{ ...styles.card, background: 'rgba(16, 185, 129, 0.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{result.correct} Correct</div>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <div>
                  <Trophy size={20} color="#fbbf24" />
                  <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#fbbf24' }}>+{result.points}</div>
                </div>
                <div>
                  <Zap size={20} color="#22d3ee" />
                  <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#22d3ee' }}>+{result.xp}</div>
                </div>
              </div>
            </div>
          </div>
          <button onClick={loadNew} style={{ ...styles.button, marginTop: '1rem', background: 'linear-gradient(to right, #a855f7, #ec4899)' }}>Next</button>
        </div>
      )}
    </div>
  );
};

const Leaderboard = ({ onBack }) => {
  const [leaders, setLeaders] = useState([]);
  useEffect(() => { mockAPI.getLeaderboard().then(setLeaders); }, []);

  return (
    <div style={{ maxWidth: '64rem', margin: '0 auto' }}>
      <button onClick={onBack} style={{ padding: '0.5rem 1rem', background: 'rgba(30, 41, 59, 0.5)', border: 'none', borderRadius: '0.5rem', color: 'white', cursor: 'pointer', marginBottom: '1.5rem', display: 'flex', gap: '0.5rem' }}><ArrowLeft size={16} />Back</button>
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}><Crown size={64} color="#fbbf24" style={{ margin: '0 auto 1rem' }} /><h2 style={{ fontSize: '2.5rem', fontWeight: 'bold' }}>Leaderboard</h2></div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {leaders.map((l, i) => <div key={i} style={{ ...styles.card, display: 'flex', justifyContent: 'space-between' }}><div style={{ display: 'flex', gap: '1rem' }}><div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#a855f7' }}>#{i + 1}</div><div style={{ fontWeight: 'bold' }}>{l.nickname}</div></div><div style={{ color: '#fbbf24', fontWeight: 'bold' }}>{l.total_points} pts</div></div>)}
        {leaders.length === 0 && <p style={{ textAlign: 'center', color: '#c4b5fd' }}>No players yet!</p>}
      </div>
    </div>
  );
};

export default function App() {
  const [screen, setScreen] = useState('register');
  const [player, setPlayer] = useState(null);
  const updateStats = (points, xp) => {
    setPlayer(prev => {
      const updated = {
        ...prev,
        total_points: (prev?.total_points || 0) + points,
        xp: (prev?.xp || 0) + xp,
        level: Math.floor(((prev?.xp || 0) + xp) / 1000) + 1
      };
      const idx = mockAPI.players.findIndex(p => p.player_id === updated.player_id);
      if (idx !== -1) {
        mockAPI.players[idx] = {
          ...mockAPI.players[idx],
          total_points: updated.total_points,
          xp: updated.xp,
          level: updated.level
        };
      }
      return updated;
    });
  };

  return (
    <div style={styles.app}>
      <header style={styles.header}>
        <div style={styles.headerContent}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}><Shield size={32} color="#22d3ee" /><h1 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>PhishTrap Academy</h1></div>
          {player && <div style={{ display: 'flex', gap: '1rem' }}><div style={{ textAlign: 'right' }}><div style={{ fontSize: '0.875rem', color: '#c4b5fd' }}>{player.nickname}</div><div style={{ color: '#fbbf24', fontWeight: 'bold' }}>{player.total_points || 0} pts</div></div><button onClick={() => { setPlayer(null); setScreen('register'); }} style={{ padding: '0.5rem 1rem', background: 'rgba(239, 68, 68, 0.2)', border: 'none', borderRadius: '0.5rem', color: 'white', cursor: 'pointer' }}>Logout</button></div>}
        </div>
      </header>
      <main style={styles.main}>
        {screen === 'register' && <Register onRegister={(p) => { setPlayer(p); setScreen('menu'); }} />}
        {screen === 'menu' && <GameMenu onSelectGame={setScreen} />}
        {screen === 'spot' && <SpotGame onBack={() => setScreen('menu')} onUpdateStats={updateStats} />}
        {screen === 'battle' && <BattleMode onBack={() => setScreen('menu')} onUpdateStats={updateStats} />}
        {screen === 'leaderboard' && <Leaderboard onBack={() => setScreen('menu')} />}
      </main>
      <footer style={styles.footer}>
        <div>PhishTrap Academy © 2025 | The Barnacles Team | Ethical Security Training</div>
      </footer>
    </div>
  );
}
