import React from 'react';
import './PolicyPage.css';

const SECTIONS = [
  {
    num: '01',
    title: 'General',
    body: 'This Website is owned and operated by Avakaaya Foods ("we," "us," or "our"). These terms and conditions govern your access to and use of this Website. By accessing or using this Website, you agree to be bound by these terms.',
  },
  {
    num: '02',
    title: 'Access to the Website',
    body: 'We grant you a non-transferable, non-exclusive licence to access and use this Website solely for your personal, non-commercial purposes. Without our prior written consent, you may not use this Website for any other purposes.',
  },
  {
    num: '03',
    title: 'User Conduct',
    body: 'You agree to responsibly and lawfully use this Website. It is prohibited to use this Website for any illegal or unauthorised purposes, including but not limited to distributing harmful content, infringing intellectual property rights, or engaging in fraudulent activities.',
  },
  {
    num: '04',
    title: 'Intellectual Property',
    body: 'All content on the Website — including text, images, logos, graphics, and software — is the property of Avakaaya Foods or its licensors and is protected by copyright and other intellectual property laws. You may not reproduce, distribute, or create derivative works without our express written permission.',
  },
  {
    num: '05',
    title: 'Links to Other Websites',
    body: 'The Website may contain links to websites not owned or operated by Avakaaya Foods. We do not control the content of these websites and accept no responsibility for them or for any loss or damage that may arise from your use of them.',
  },
  {
    num: '06',
    title: 'Disclaimer of Warranties',
    body: 'The Website is provided "as is" and "as available." We make no warranties, express or implied, regarding the operation of the Website or the information, content, materials, or products included on the Website, to the fullest extent permissible by applicable law.',
  },
  {
    num: '07',
    title: 'Limitation of Liability',
    body: 'To the maximum extent permitted by law, Avakaaya Foods shall not be liable for any damages arising from your use of the Website, including direct, indirect, incidental, special, consequential, or exemplary damages, even if we have been advised of the possibility of such damages.',
  },
  {
    num: '08',
    title: 'Indemnification',
    body: 'You agree to indemnify, defend, and hold Avakaaya Foods, its officers, directors, employees, agents, and suppliers harmless from any claims, losses, damages, liabilities, costs, and expenses (including reasonable legal fees) arising from your violation of these terms or your use of the Website.',
  },
  {
    num: '09',
    title: 'Changes to Terms and Conditions',
    body: 'We reserve the right to modify these terms and conditions at any time by posting the updated terms on the Website. Your continued use of the Website after any changes constitutes your acceptance of the new terms. It is your responsibility to review these terms periodically.',
  },
  {
    num: '10',
    title: 'Entire Agreement',
    body: 'These terms and conditions constitute the entire agreement between you and Avakaaya Foods concerning your use of the Website, superseding any prior communications or agreements, whether oral or written.',
  },
  {
    num: '11',
    title: 'Governing Law',
    body: 'These terms and conditions are governed by the laws of the State of Andhra Pradesh, India, without regard to its conflict of laws principles. Any disputes arising under these terms shall be subject to the exclusive jurisdiction of the courts of Hyderabad, Telangana.',
  },
  {
    num: '12',
    title: 'Severability',
    body: 'If any provision of these terms and conditions is deemed invalid or unenforceable by a court of competent jurisdiction, that provision shall be deemed severable from these terms, and the remaining provisions shall continue in full force and effect.',
  },
  {
    num: '13',
    title: 'Waiver',
    body: 'No waiver of any provision of these terms and conditions shall be effective unless made in writing and signed by an authorised representative of Avakaaya Foods. A waiver of any provision shall not be deemed a waiver of any other provision or of the same provision on any other occasion.',
  },
  {
    num: '14',
    title: 'Notices',
    body: 'All notices and communications relating to these terms shall be in writing and considered duly given when delivered in person, sent via registered mail, or sent via email to care@avakaayfoods.com.',
  },
];

const Terms = () => (
  <div className="policy-page">
    <div className="policy-hero">
      <span className="policy-eyebrow">Legal</span>
      <h1>Terms &amp; Conditions</h1>
      <p>Please read these terms carefully before using our website or placing an order.</p>
    </div>

    <div className="policy-body">
      <div className="container">
        <div className="policy-sections">
          {SECTIONS.map(s => (
            <div key={s.num} className="policy-section">
              <h2>
                <span className="policy-num">{s.num}</span>
                {s.title}
              </h2>
              <p>{s.body}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
);

export default Terms;
