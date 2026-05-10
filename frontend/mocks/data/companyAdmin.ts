export type CompanyStatus = 'active' | 'suspended'
export type MemberRole = 'company_admin' | 'user'
export type JoinRequestStatus = 'pending' | 'approved' | 'rejected'

export interface CompanyAdminCompany {
  id: string
  name: string
  sector: string | null
  logo_url: string | null
  status: CompanyStatus
  created_at: string
}

export interface CompanyAdminMember {
  id: string
  name: string
  email: string
  role: MemberRole
  company_id: string | null
  is_active: boolean
  created_at: string
}

export interface CompanyJoinRequest {
  id: string
  user_id: string
  user_name: string
  user_email: string
  company_id: string
  status: JoinRequestStatus
  created_at: string
  resolved_at: string | null
}

export interface CompanyMetricsSnapshot {
  total_predictions: number
  predictions_by_day: Array<{
    date: string
    count: number
  }>
  feedback_rate: number
  top_labels: Array<{
    label: string
    count: number
  }>
}

export interface CompanySettingsSnapshot {
  name: string
  logo_url: string
}

export interface CompanyHighlight {
  id: string
  tone: 'info' | 'warning' | 'success'
  title: string
  description: string
}

export interface CompanyAdminDataset {
  company: CompanyAdminCompany
  users: CompanyAdminMember[]
  requests: CompanyJoinRequest[]
  metrics: CompanyMetricsSnapshot
  settings: CompanySettingsSnapshot
  highlights: CompanyHighlight[]
}

export const companyAdminMock: CompanyAdminDataset = {
  company: {
    id: 'cmp-green-valley',
    name: 'Green Valley Produce',
    sector: 'Vegetable production',
    logo_url: null,
    status: 'active',
    created_at: '2024-09-14T10:00:00Z',
  },
  users: [
    {
      id: 'usr-gabriela',
      name: 'Gabriela Torres',
      email: 'gabriela.torres@greenvalley.mx',
      role: 'company_admin',
      company_id: 'cmp-green-valley',
      is_active: true,
      created_at: '2024-09-14T10:00:00Z',
    },
    {
      id: 'usr-sofia',
      name: 'Sofia Ramirez',
      email: 'sofia.ramirez@greenvalley.mx',
      role: 'company_admin',
      company_id: 'cmp-green-valley',
      is_active: true,
      created_at: '2024-09-19T12:30:00Z',
    },
    {
      id: 'usr-daniel',
      name: 'Daniel Ortega',
      email: 'daniel.ortega@greenvalley.mx',
      role: 'user',
      company_id: 'cmp-green-valley',
      is_active: true,
      created_at: '2024-10-02T09:15:00Z',
    },
    {
      id: 'usr-mateo',
      name: 'Mateo Cruz',
      email: 'mateo.cruz@greenvalley.mx',
      role: 'user',
      company_id: 'cmp-green-valley',
      is_active: false,
      created_at: '2024-10-18T15:45:00Z',
    },
    {
      id: 'usr-elena',
      name: 'Elena Ruiz',
      email: 'elena.ruiz@greenvalley.mx',
      role: 'user',
      company_id: 'cmp-green-valley',
      is_active: true,
      created_at: '2024-11-03T08:20:00Z',
    },
    {
      id: 'usr-lucia',
      name: 'Lucia Navarro',
      email: 'lucia.navarro@greenvalley.mx',
      role: 'user',
      company_id: 'cmp-green-valley',
      is_active: true,
      created_at: '2024-11-22T13:10:00Z',
    },
  ],
  requests: [
    {
      id: 'req-andres',
      user_id: 'usr-andres',
      user_name: 'Andres Perez',
      user_email: 'andres.perez@greenvalley.mx',
      company_id: 'cmp-green-valley',
      status: 'pending',
      created_at: '2026-05-03T09:20:00Z',
      resolved_at: null,
    },
    {
      id: 'req-maria',
      user_id: 'usr-maria',
      user_name: 'Maria Campos',
      user_email: 'maria.campos@greenvalley.mx',
      company_id: 'cmp-green-valley',
      status: 'pending',
      created_at: '2026-05-02T13:05:00Z',
      resolved_at: null,
    },
    {
      id: 'req-jose',
      user_id: 'usr-jose',
      user_name: 'Jose Velazquez',
      user_email: 'jose.velazquez@greenvalley.mx',
      company_id: 'cmp-green-valley',
      status: 'pending',
      created_at: '2026-04-30T16:40:00Z',
      resolved_at: null,
    },
    {
      id: 'req-valeria',
      user_id: 'usr-valeria',
      user_name: 'Valeria Solis',
      user_email: 'valeria.solis@greenvalley.mx',
      company_id: 'cmp-green-valley',
      status: 'approved',
      created_at: '2026-04-27T11:15:00Z',
      resolved_at: '2026-04-27T14:30:00Z',
    },
  ],
  metrics: {
    total_predictions: 186,
    predictions_by_day: [
      {
        date: '2026-04-29',
        count: 19,
      },
      {
        date: '2026-04-30',
        count: 24,
      },
      {
        date: '2026-05-01',
        count: 21,
      },
      {
        date: '2026-05-02',
        count: 27,
      },
      {
        date: '2026-05-03',
        count: 30,
      },
      {
        date: '2026-05-04',
        count: 31,
      },
      {
        date: '2026-05-05',
        count: 34,
      },
    ],
    feedback_rate: 0.72,
    top_labels: [
      {
        label: 'Tomato_Early_Blight',
        count: 74,
      },
      {
        label: 'Tomato_Leaf_Mold',
        count: 49,
      },
      {
        label: 'Tomato_Septoria_Leaf_Spot',
        count: 36,
      },
      {
        label: 'Tomato_Healthy',
        count: 27,
      },
    ],
  },
  settings: {
    name: 'Green Valley Produce',
    logo_url: '',
  },
  highlights: [
    {
      id: 'highlight-requests',
      tone: 'warning',
      title: '3 join requests need review',
      description: 'Field users are waiting for company access before the next scouting round starts.',
    },
    {
      id: 'highlight-users',
      tone: 'info',
      title: '1 inactive team member',
      description: 'Review the roster to confirm whether inactive members should remain assigned to the company.',
    },
    {
      id: 'highlight-label',
      tone: 'success',
      title: 'Early blight is the top label this week',
      description: 'Most detections are concentrated in the west block and should be watched closely.',
    },
  ],
}

export function getCompanyOverviewSummary(data: CompanyAdminDataset = companyAdminMock) {
  const totalMembers = data.users.length
  const activeMembers = data.users.filter((user) => user.is_active).length
  const inactiveMembers = totalMembers - activeMembers
  const adminMembers = data.users.filter((user) => user.role === 'company_admin').length
  const pendingRequests = data.requests.filter((request) => request.status === 'pending').length

  return {
    totalMembers,
    activeMembers,
    inactiveMembers,
    adminMembers,
    pendingRequests,
  }
}