export type City = {
  city_id: number
  city_name: string
}

export type District = {
  district_id: number
  district_name: string
  city_id: number
}

export type Neighborhood = {
  neighborhood_id: number
  neighborhood_name: string
  district_id: number
  last_crawled_at: string | null
}

export type ServerRegionInfo = {
  city_name: string
  district_name: string
  neighborhood_name: string
  last_crawled_at: string | null
}
