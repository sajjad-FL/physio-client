import { api } from '../config/api'

/**
 * Updates saved profile address using full PATCH /profile (server requires name, dob, gender, etc.).
 * @param {{ text: string, lat: number, lng: number }} address
 */
export async function patchProfileAddress({ text, lat, lng }) {
  const { data } = await api.get('/profile')
  const body = {
    name: data.name || '',
    email: data.email || '',
    dob: data.dob,
    gender: data.gender,
    address: {
      text: text.trim(),
      lat,
      lng,
    },
  }
  if ((data.role === 'physio' || data.roles?.includes('physio')) && data.physio) {
    body.specialization = data.physio.specialization || ''
    body.experience = data.physio.experience ?? 0
    body.fees = data.physio.fees ?? 0
    body.feesMax = data.physio.feesMax ?? null
  }
  await api.patch('/profile', body)
}
