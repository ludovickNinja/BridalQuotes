/* BridalQuotes POC — retailer accounts (userAccount_act.asp SM_company, confirmEmails_form)
 * Observed: Crown Samples (Cora) uaID 2875 (test), Friends and Family (CrownRing Staff) Montreal 2954, USA 4546.
 * The rest is demo data. Emails on the Friends and Family account deliberately keep the duplicate /
 * case-variant addresses seen in the live picker (bug #9 in the system map).
 */
window.ACCOUNTS = [
  {
    uaID: 2875, name: 'Crown Samples (Cora)', clientStatus: 'Active Client', currency: 'USD', country: 'Canada',
    contact: 'Cora', phone: '514-000-0000', billing: '9400 Boul. Saint-Laurent, Montréal QC H2N 1P2',
    shipping: [{ shippingID: 4554, label: '', address: '9400 Boul. Saint-Laurent, Montréal QC H2N 1P2' }],
    emails: ['ludovick@crownring.com', 'cora@crownring.com', 'samples@crownring.com']
  },
  {
    uaID: 2954, name: 'Friends and Family (CrownRing Staff) Montreal', clientStatus: 'Active Client', currency: 'CAD', country: 'Canada',
    contact: 'CrownRing Staff', phone: '514-000-0001', billing: '9400 Boul. Saint-Laurent, Montréal QC H2N 1P2',
    shipping: [
      { shippingID: 5101, label: '', address: '9400 Boul. Saint-Laurent, Montréal QC H2N 1P2' },
      { shippingID: 5102, label: '', address: 'Pick up at reception' },
      { shippingID: 5103, label: '', address: 'Bridal department, 2nd floor' },
      { shippingID: 5104, label: '', address: 'Factory shipping dock' }
    ],
    emails: ['ilan@crownring.com', 'Ilan@crownring.com', 'ilan@crownring.com ', 'ILAN@CROWNRING.COM', 'jennifer.lavigne@crownring.com', 'Jennifer.Lavigne@crownring.com',
      'jennifer.lavigne@crownring.com', 'brian.bv@crownring.com', 'Brian.BV@crownring.com', 'ludovick@crownring.com', 'bhawna@crownring.com', 'phil@crownring.com']
  },
  {
    uaID: 4546, name: 'Friends and Family (CrownRing Staff) USA', clientStatus: 'Active Client', currency: 'USD', country: 'USA',
    contact: 'CrownRing Staff', phone: '212-000-0002', billing: '48 W 48th St, New York NY 10036',
    shipping: [{ shippingID: 6101, label: '', address: '48 W 48th St, New York NY 10036' }],
    emails: ['usa@crownring.com', 'ludovick@crownring.com']
  },
  {
    uaID: 3101, name: 'Bijouterie Démo Laval', clientStatus: 'Active Client', currency: 'CAD', country: 'Canada',
    contact: 'Marie-Ève', phone: '450-555-0101', billing: '1700 Boul. Le Corbusier, Laval QC H7S 2K7',
    shipping: [{ shippingID: 7101, label: '', address: '1700 Boul. Le Corbusier, Laval QC H7S 2K7' }, { shippingID: 7102, label: '', address: 'Carrefour Laval, kiosk 42' }],
    emails: ['marie-eve@bijouteriedemo.example', 'atelier@bijouteriedemo.example']
  },
  {
    uaID: 3102, name: 'Demo Jewelers Toronto', clientStatus: 'Active Client', currency: 'CAD', country: 'Canada',
    contact: 'Priya', phone: '416-555-0102', billing: '27 Queen St E, Toronto ON M5C 2M6',
    shipping: [{ shippingID: 7201, label: '', address: '27 Queen St E, Toronto ON M5C 2M6' }],
    emails: ['priya@demojewelers.example', 'orders@demojewelers.example']
  },
  {
    uaID: 3103, name: 'Sample Fine Jewelry NY', clientStatus: 'Active Client', currency: 'USD', country: 'USA',
    contact: 'David', phone: '212-555-0103', billing: '580 5th Ave, New York NY 10036',
    shipping: [{ shippingID: 7301, label: '', address: '580 5th Ave, New York NY 10036' }],
    emails: ['david@samplefinejewelry.example']
  },
  {
    uaID: 3104, name: 'Closed Retailer (inactive)', clientStatus: 'Inactive', currency: 'CAD', country: 'Canada',
    contact: 'n/a', phone: '', billing: '—', shipping: [], emails: []
  }
];
window.ACCOUNTS.byID = id => window.ACCOUNTS.find(a => a.uaID === Number(id));
window.ACCOUNTS.search = q => { q = (q || '').trim().toLowerCase(); return q ? window.ACCOUNTS.filter(a => a.clientStatus === 'Active Client' && a.name.toLowerCase().includes(q)) : []; };
