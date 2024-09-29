/* eslint-disable @typescript-eslint/no-unused-vars */
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const genreId = searchParams.get('genreId')

  if (!genreId) {
    return NextResponse.json({ error: 'Genre ID is required' }, { status: 400 })
  }

  try {
    const apiUrl = `https://api.jikan.moe/v4/anime?genres=${genreId}&order_by=popularity&sort=asc&min_score=6&limit=25`
    console.log('Fetching from:', apiUrl)
    const response = await fetch(apiUrl)
    const data = await response.json()
    console.log('API Response:', data)
    return NextResponse.json(data)
  } catch (error) {
    console.error('Error fetching anime data:', error)
    return NextResponse.json({ error: 'Error fetching anime data' }, { status: 500 })
  }
}
