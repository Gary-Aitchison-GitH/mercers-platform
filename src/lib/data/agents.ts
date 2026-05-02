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

export const agents: Agent[] = []

export const getAgentById = (id: string) => agents.find(a => a.id === id)
