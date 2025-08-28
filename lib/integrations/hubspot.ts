import { Lead, Consultation } from '@/lib/types'

export class HubSpotIntegration {
  private apiKey: string
  private baseUrl = 'https://api.hubapi.com'

  constructor(apiKey: string) {
    this.apiKey = apiKey
  }

  async createContact(lead: Lead): Promise<string | null> {
    try {
      const contactData = {
        properties: {
          email: lead.email,
          firstname: lead.name?.split(' ')[0] || '',
          lastname: lead.name?.split(' ').slice(1).join(' ') || '',
          company: lead.company || '',
          jobtitle: lead.position || '',
          phone: lead.phone || '',
          lead_source: lead.source,
          lead_score: lead.lead_score?.toString() || '0',
          utm_source: lead.utm_source || '',
          utm_medium: lead.utm_medium || '',
          utm_campaign: lead.utm_campaign || '',
          lifecyclestage: this.getLifecycleStage(lead.status),
          ai_implementation_interest: 'true',
        }
      }

      const response = await fetch(`${this.baseUrl}/crm/v3/objects/contacts`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(contactData)
      })

      if (!response.ok) {
        const error = await response.json()
        console.error('HubSpot contact creation failed:', error)
        return null
      }

      const result = await response.json()
      return result.id

    } catch (error) {
      console.error('HubSpot API error:', error)
      return null
    }
  }

  async updateContact(contactId: string, updates: Partial<Lead>): Promise<boolean> {
    try {
      const updateData = {
        properties: this.mapLeadToHubSpotProperties(updates)
      }

      const response = await fetch(`${this.baseUrl}/crm/v3/objects/contacts/${contactId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updateData)
      })

      return response.ok

    } catch (error) {
      console.error('HubSpot contact update error:', error)
      return false
    }
  }

  async createDeal(consultation: Consultation, contactId: string): Promise<string | null> {
    try {
      const dealData = {
        properties: {
          dealname: `AI Implementation Consultation - ${consultation.company}`,
          dealstage: this.getDealStage(consultation.status),
          pipeline: 'default', // You'd configure this in HubSpot
          amount: this.estimateDealValue(consultation),
          closedate: consultation.scheduled_date || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          consultation_type: consultation.consultation_type,
          business_challenge: consultation.business_challenge || '',
          budget_range: consultation.budget_range || '',
          decision_timeline: consultation.decision_timeline || '',
        },
        associations: [
          {
            to: { id: contactId },
            types: [{ associationCategory: 'HUBSPOT_DEFINED', associationTypeId: 3 }] // Contact to Deal
          }
        ]
      }

      const response = await fetch(`${this.baseUrl}/crm/v3/objects/deals`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(dealData)
      })

      if (!response.ok) {
        const error = await response.json()
        console.error('HubSpot deal creation failed:', error)
        return null
      }

      const result = await response.json()
      return result.id

    } catch (error) {
      console.error('HubSpot deal creation error:', error)
      return null
    }
  }

  async addToList(contactId: string, listId: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/contacts/v1/lists/${listId}/add`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          vids: [parseInt(contactId)]
        })
      })

      return response.ok

    } catch (error) {
      console.error('HubSpot list addition error:', error)
      return false
    }
  }

  async trackEvent(contactId: string, eventName: string, eventProperties: Record<string, any>): Promise<boolean> {
    try {
      const eventData = {
        eventName,
        properties: eventProperties,
        objectId: contactId,
        objectType: 'contact'
      }

      const response = await fetch(`${this.baseUrl}/events/v3/send`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(eventData)
      })

      return response.ok

    } catch (error) {
      console.error('HubSpot event tracking error:', error)
      return false
    }
  }

  private getLifecycleStage(status: string): string {
    const stageMapping: Record<string, string> = {
      'new': 'lead',
      'qualified': 'marketingqualifiedlead',
      'nurturing': 'marketingqualifiedlead',
      'converted': 'customer',
      'lost': 'other'
    }
    return stageMapping[status] || 'lead'
  }

  private getDealStage(status: string): string {
    const stageMapping: Record<string, string> = {
      'requested': 'appointmentscheduled',
      'confirmed': 'appointmentscheduled',
      'completed': 'qualifiedtobuy',
      'cancelled': 'closedlost',
      'no_show': 'closedlost'
    }
    return stageMapping[status] || 'appointmentscheduled'
  }

  private estimateDealValue(consultation: Consultation): string {
    // Estimate deal value based on consultation details
    const budgetRangeValues: Record<string, number> = {
      'under_1M': 500000,
      '1M_5M': 2500000,
      '5M_10M': 7500000,
      '10M_50M': 25000000,
      'over_50M': 75000000,
    }

    const estimatedValue = consultation.budget_range 
      ? budgetRangeValues[consultation.budget_range] || 1000000
      : 1000000

    // Apply consultation type multiplier
    const typeMultipliers: Record<string, number> = {
      'initial': 0.3,
      'technical': 0.5,
      'strategy': 0.7,
      'implementation': 1.0,
    }

    const multiplier = consultation.consultation_type
      ? typeMultipliers[consultation.consultation_type] || 0.5
      : 0.5

    return Math.round(estimatedValue * multiplier).toString()
  }

  private mapLeadToHubSpotProperties(lead: Partial<Lead>): Record<string, any> {
    const properties: Record<string, any> = {}

    if (lead.name) {
      properties.firstname = lead.name.split(' ')[0] || ''
      properties.lastname = lead.name.split(' ').slice(1).join(' ') || ''
    }
    if (lead.email) properties.email = lead.email
    if (lead.company) properties.company = lead.company
    if (lead.position) properties.jobtitle = lead.position
    if (lead.phone) properties.phone = lead.phone
    if (lead.source) properties.lead_source = lead.source
    if (lead.lead_score !== undefined) properties.lead_score = lead.lead_score.toString()
    if (lead.utm_source) properties.utm_source = lead.utm_source
    if (lead.utm_medium) properties.utm_medium = lead.utm_medium
    if (lead.utm_campaign) properties.utm_campaign = lead.utm_campaign
    if (lead.status) properties.lifecyclestage = this.getLifecycleStage(lead.status)
    if (lead.last_activity_at) properties.last_activity_date = lead.last_activity_at

    return properties
  }
}