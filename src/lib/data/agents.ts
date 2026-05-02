export interface Agent {
  id: string
  name: string
  role: string
  roleSn: string
  roleNd: string
  regionalPresence: string[]
  phone: string
  email: string
  bio: string
  bioSn: string
  bioNd: string
  specialties: string[]
  image: string
}

export const agents: Agent[] = [
  {
    id: 'agent-1',
    name: 'Senior Agent — Harare',
    role: 'Principal Agent',
    roleSn: 'Mumiririri Mukuru',
    roleNd: 'Umsebenzi Omkhulu',
    regionalPresence: ['Harare', 'Nationwide'],
    phone: '+263 4 XXX XXXX',
    email: 'harare@mercers.co.zw',
    bio: 'Senior property specialist with extensive knowledge of the Harare commercial and industrial market. Specializing in large agricultural and industrial transactions across Zimbabwe.',
    bioSn: 'Nyanzvi yepfuma ine ruzivo rwakawanda wemahara webiznisi uye indasitiri. Anoparadzanisa mukutengesa misha mikuru yezvirimo uye indasitiri muZimbabwe yose.',
    bioNd: 'Uchwepheshe wezindawo olomalwazi mayelana nezimakethe zeHarare zohwebo lezezimboni. Igxile ezinhlelweni ezinkulu zamasimu lezezimboni kuZimbabwe lonke.',
    specialties: ['Commercial', 'Industrial', 'Agricultural'],
    image: '/images/agent-harare-1.jpg',
  },
  {
    id: 'agent-2',
    name: 'Commercial Specialist — Harare',
    role: 'Commercial Agent',
    roleSn: 'Mumiririri webiznisi',
    roleNd: 'Umsebenzi Wohwebo',
    regionalPresence: ['Victoria Falls', 'Matabeleland', 'Nationwide'],
    phone: '+263 4 XXX XXXX',
    email: 'commercial@mercers.co.zw',
    bio: 'Dedicated commercial property agent with expertise in the Victoria Falls tourism and hospitality sector. Strong network across Zimbabwe\'s commercial property market.',
    bioSn: 'Mumiririri ane ruzivo rwezviwanikwa zvekuVictoria Falls uye zvekushanyirwa. Ane mazano mazhinji mumahara yebiznisi.',
    bioNd: 'Umsebenzi olomalwazi ezindaweni zohwebo lezokuvakasha eVictoria Falls. Unoxhumano oluhle ezimaketheni zohwebo eZimbabwe.',
    specialties: ['Commercial', 'Tourism', 'Hospitality'],
    image: '/images/agent-harare-2.jpg',
  },
  {
    id: 'agent-3',
    name: 'Industrial Specialist — Marondera',
    role: 'Industrial Agent',
    roleSn: 'Mumiririri weIndasitiri',
    roleNd: 'Umsebenzi Wezezimboni',
    regionalPresence: ['Marondera', 'Zvishavane', 'Chiredzi'],
    phone: '+263 79 XXX XXXX',
    email: 'industrial@mercers.co.zw',
    bio: 'Industrial property expert covering Marondera, Zvishavane and Chiredzi. Deep knowledge of southern Zimbabwe\'s industrial landscape and warehousing market.',
    bioSn: 'Nyanzvi yenzvimbo dzeindasitiri dzeMurondera, Zvishavane neChiredzi. Ane ruzivo rwakakura rwenzvimbo dzeindasitiri muZimbabwe yekunyika.',
    bioNd: 'Uchwepheshe wezindawo zezezimboni eMarondera, Zvishavane leChiredzi. Ulolomalwazi ezindaweni zezezimboni eZimbabwe yeningizimu.',
    specialties: ['Industrial', 'Warehousing', 'Commercial'],
    image: '/images/agent-marondera-1.jpg',
  },
  {
    id: 'agent-4',
    name: 'Dawn Brown',
    role: 'Senior Property Consultant',
    roleSn: 'Mumiririri Mukuru wePfuma',
    roleNd: 'Uchwepheshe Omkhulu Wezindawo',
    regionalPresence: ['Mashonaland East', 'Harare', 'Nationwide'],
    phone: '+263 79 XXX XXXX',
    email: 'dawn@mercers.co.zw',
    bio: 'Senior property consultant with a wealth of local knowledge across Mashonaland East and Harare. Passionate about connecting clients with the right property and the right agent for outstanding results.',
    bioSn: 'Mumiririri mukuru ane ruzivo rwakawanda rwenyika muMashonaland East neHarare. Anoda kubatanidza vatengi nemisha yakakodzera uye mumiririri akanaka.',
    bioNd: 'Uchwepheshe omkhulu wezindawo ololomalwazi eMashonaland East leHarare. Uthanda ukuxhumanisa amakhasimende lezindawo ezifanelekile lomsebenzi ofanelekile.',
    specialties: ['Residential', 'Commercial', 'Agricultural'],
    image: '/images/dawn-brown.jpg',
  },
]

export const getAgentById = (id: string) => agents.find(a => a.id === id)
