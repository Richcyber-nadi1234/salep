export interface Transaction {
  transaction_id: string;
  date: string;
  region: string;
  sale_amount: number;
  customer_segment: string;
  lead_source: string;
  status: string;
}

const regions = ["North America", "Europe", "Asia Pacific", "Latin America"];
const segments = ["SMB", "Enterprise", "Mid-Market"];
const leadSources = ["Google Ads", "Direct", "Partner", "Referral", "LinkedIn"];
const statuses = ["Closed Won", "Closed Lost", "In Progress"];

// Generate mock data for the last 90 days
export const generateMockData = (): Transaction[] => {
  const data: Transaction[] = [];
  const today = new Date();
  
  for (let i = 0; i < 150; i++) {
    const daysAgo = Math.floor(Math.random() * 90);
    const date = new Date(today);
    date.setDate(date.getDate() - daysAgo);
    
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    const saleAmount = status === "Closed Won" 
      ? Math.floor(Math.random() * 50000) + 5000
      : status === "In Progress"
      ? Math.floor(Math.random() * 30000) + 5000
      : 0;
    
    data.push({
      transaction_id: `T-${Math.random().toString(36).substring(2, 9).toUpperCase()}`,
      date: date.toISOString().split('T')[0],
      region: regions[Math.floor(Math.random() * regions.length)],
      sale_amount: saleAmount,
      customer_segment: segments[Math.floor(Math.random() * segments.length)],
      lead_source: leadSources[Math.floor(Math.random() * leadSources.length)],
      status: status,
    });
  }
  
  return data.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
};

export const mockTransactions = generateMockData();
