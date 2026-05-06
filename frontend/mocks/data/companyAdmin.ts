export type CompanyStatus = 'active' | 'suspended'
export type MemberRole = 'company_admin' | 'user'
export type MemberStatus = 'active' | 'inactive'
export type JoinRequestStatus = 'pending' | 'approved' | 'rejected'
export type CompanyMetricsTrend = 'up' | 'down' | 'stable'
export type CompanyMetricsActivityTone = 'info' | 'warning' | 'success'

export interface CompanyAdminCompany {
  id: string
  name: string
  sector: string
  status: CompanyStatus
  createdAt: string
  location: string
  adminName: string
  description: string
}

export interface CompanyAdminMember {
  id: string
  name: string
  email: string
  role: MemberRole
  status: MemberStatus
  zone: string
  lastActiveAt: string
}

export interface CompanyJoinRequest {
  id: string
  name: string
  email: string
  status: JoinRequestStatus
  requestedAt: string
  zone: string
  requestedRole: MemberRole
}

export interface CompanyMetricsSnapshot {
  predictionsThisWeek: number
  feedbackRate: number
  weeklyGrowth: number
  topLabel: string
  zonePerformance: Array<{
    zone: string
    predictions: number
    feedbackRate: number
    trend: CompanyMetricsTrend
  }>
  recentActivity: Array<{
    id: string
    title: string
    value: string
    description: string
    tone: CompanyMetricsActivityTone
  }>
}

export interface CompanySettingsSnapshot {
  profile: {
    name: string
    sector: string
    location: string
    description: string
    adminName: string
    adminContactEmail: string
  }
  accessPolicy: {
    joinRequestsEnabled: boolean
    requireAdminApproval: boolean
    defaultMemberRole: MemberRole
  }
  audit: {
    updatedBy: string
    updatedAt: string
  }
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
    status: 'active',
    createdAt: '2024-09-14',
    location: 'Jalisco, Mexico',
    adminName: 'Gabriela Torres',
    description:
      'Green Valley Produce coordinates field teams across three growing zones, using CropSight to centralize crop health observations and speed up operational responses.',
  },
  users: [
    {
      id: 'usr-gabriela',
      name: 'Gabriela Torres',
      email: 'gabriela.torres@greenvalley.mx',
      role: 'company_admin',
      status: 'active',
      zone: 'North cluster',
      lastActiveAt: '2026-05-05T08:15:00',
    },
    {
      id: 'usr-sofia',
      name: 'Sofia Ramirez',
      email: 'sofia.ramirez@greenvalley.mx',
      role: 'company_admin',
      status: 'active',
      zone: 'Operations hub',
      lastActiveAt: '2026-05-04T16:40:00',
    },
    {
      id: 'usr-daniel',
      name: 'Daniel Ortega',
      email: 'daniel.ortega@greenvalley.mx',
      role: 'user',
      status: 'active',
      zone: 'West block',
      lastActiveAt: '2026-05-05T06:55:00',
    },
    {
      id: 'usr-mateo',
      name: 'Mateo Cruz',
      email: 'mateo.cruz@greenvalley.mx',
      role: 'user',
      status: 'inactive',
      zone: 'South block',
      lastActiveAt: '2026-04-27T14:10:00',
    },
    {
      id: 'usr-elena',
      name: 'Elena Ruiz',
      email: 'elena.ruiz@greenvalley.mx',
      role: 'user',
      status: 'active',
      zone: 'East greenhouses',
      lastActiveAt: '2026-05-04T11:25:00',
    },
    {
      id: 'usr-lucia',
      name: 'Lucia Navarro',
      email: 'lucia.navarro@greenvalley.mx',
      role: 'user',
      status: 'active',
      zone: 'West block',
      lastActiveAt: '2026-05-03T18:05:00',
    },
  ],
  requests: [
    {
      id: 'req-andres',
      name: 'Andres Perez',
      email: 'andres.perez@greenvalley.mx',
      status: 'pending',
      requestedAt: '2026-05-03',
      zone: 'West block',
      requestedRole: 'user',
    },
    {
      id: 'req-maria',
      name: 'Maria Campos',
      email: 'maria.campos@greenvalley.mx',
      status: 'pending',
      requestedAt: '2026-05-02',
      zone: 'East greenhouses',
      requestedRole: 'user',
    },
    {
      id: 'req-jose',
      name: 'Jose Velazquez',
      email: 'jose.velazquez@greenvalley.mx',
      status: 'pending',
      requestedAt: '2026-04-30',
      zone: 'North cluster',
      requestedRole: 'user',
    },
    {
      id: 'req-valeria',
      name: 'Valeria Solis',
      email: 'valeria.solis@greenvalley.mx',
      status: 'approved',
      requestedAt: '2026-04-27',
      zone: 'Operations hub',
      requestedRole: 'company_admin',
    },
  ],
  metrics: {
    predictionsThisWeek: 186,
    feedbackRate: 0.72,
    weeklyGrowth: 12,
    topLabel: 'Early blight',
    zonePerformance: [
      {
        zone: 'West block',
        predictions: 64,
        feedbackRate: 0.78,
        trend: 'up',
      },
      {
        zone: 'East greenhouses',
        predictions: 49,
        feedbackRate: 0.74,
        trend: 'stable',
      },
      {
        zone: 'North cluster',
        predictions: 41,
        feedbackRate: 0.68,
        trend: 'up',
      },
      {
        zone: 'South block',
        predictions: 32,
        feedbackRate: 0.61,
        trend: 'down',
      },
    ],
    recentActivity: [
      {
        id: 'activity-feedback',
        title: 'Feedback closure improved',
        value: '72%',
        description: 'The team closed more prediction reviews than last week across the active zones.',
        tone: 'success',
      },
      {
        id: 'activity-west',
        title: 'West block leads volume',
        value: '64 predictions',
        description: 'Most detections this week came from the west block and are driving the top label trend.',
        tone: 'info',
      },
      {
        id: 'activity-south',
        title: 'South block needs attention',
        value: '61% feedback',
        description: 'Review turnaround is lagging in the south block compared with the rest of the company.',
        tone: 'warning',
      },
    ],
  },
  settings: {
    profile: {
      name: 'Green Valley Produce',
      sector: 'Vegetable production',
      location: 'Jalisco, Mexico',
      description:
        'Green Valley Produce coordinates field teams across three growing zones, using CropSight to centralize crop health observations and speed up operational responses.',
      adminName: 'Gabriela Torres',
      adminContactEmail: 'gabriela.torres@greenvalley.mx',
    },
    accessPolicy: {
      joinRequestsEnabled: true,
      requireAdminApproval: true,
      defaultMemberRole: 'user',
    },
    audit: {
      updatedBy: 'Gabriela Torres',
      updatedAt: '2026-05-05T09:10:00',
    },
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
      description: 'Review the members list to confirm whether access should be restored or removed.',
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
  const activeMembers = data.users.filter((user) => user.status === 'active').length
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