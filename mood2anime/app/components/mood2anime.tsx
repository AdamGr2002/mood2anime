/* eslint-disable @typescript-eslint/no-unused-vars */
"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import ReactPlayer from "react-player/lazy"
import { Sparkles, Star, ChevronLeft, ChevronRight } from "lucide-react"

const moodEmojis = [
  { emoji: "😊", mood: "Happy", genreId: 4 },
  { emoji: "😢", mood: "Sad", genreId: 8 },
  { emoji: "😆", mood: "Excited", genreId: 1 },
  { emoji: "😌", mood: "Relaxed", genreId: 36 },
  { emoji: "😍", mood: "Romantic", genreId: 22 },
  { emoji: "😨", mood: "Scared", genreId: 14 },
  { emoji: "🤔", mood: "Thoughtful", genreId: 7 },
  { emoji: "😔", mood: "Gloomy", genreId: 8 },
  { emoji: "😤", mood: "Angry", genreId: 1 },
  { emoji: "🤩", mood: "Amazed", genreId: 10 },
  { emoji: "😎", mood: "Cool", genreId: 24 },
  { emoji: "🥺", mood: "Emotional", genreId: 8 },
]

interface Anime {
  mal_id: number
  title: string
  synopsis: string
  genres: { name: string }[]
  score: number
  episodes: number
  aired: { string: string }
  trailer: {
    youtube_id: string
    url: string
  }
}

// Proxy server URL to handle CORS issues
const PROXY_URL = "https://cors-anywhere.herokuapp.com/"

// Cache interface
interface Cache {
  [key: number]: {
    data: Anime[]
    timestamp: number
  }
}

export default function Mood2Anime() {
  const [selectedMood, setSelectedMood] = useState<string | null>(null)
  const [recommendedAnime, setRecommendedAnime] = useState<Anime[]>([])
  const [currentAnimeIndex, setCurrentAnimeIndex] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [cache, setCache] = useState<Cache>({})

  // Cache expiration time (1 hour)
  const CACHE_EXPIRATION = 60 * 60 * 1000

  useEffect(() => {
    // Clean up expired cache entries
    const now = Date.now()
    const newCache = { ...cache }
    Object.keys(newCache).forEach((key) => {
      if (now - newCache[Number(key)].timestamp > CACHE_EXPIRATION) {
        delete newCache[Number(key)]
      }
    })
    setCache(newCache)
  }, [cache])

  const fetchAnimeByMood = async (genreId: number) => {
    setLoading(true)
    setError(null)

    // Check if data is in cache and not expired
    if (cache[genreId] && Date.now() - cache[genreId].timestamp < CACHE_EXPIRATION) {
      setRecommendedAnime(cache[genreId].data)
      setCurrentAnimeIndex(0)
      setLoading(false)
      return
    }

    try {
      const response = await fetch(`${PROXY_URL}https://api.jikan.moe/v4/anime?genres=${genreId}&order_by=popularity&sort=desc&limit=20`)
      const data = await response.json()

      if (data.data && data.data.length > 0) {
        const animeWithTrailers = data.data.filter((anime: Anime) => anime.trailer && anime.trailer.youtube_id)
        if (animeWithTrailers.length > 0) {
          setRecommendedAnime(animeWithTrailers)
          setCurrentAnimeIndex(0)
          // Update cache
          setCache((prevCache) => ({
            ...prevCache,
            [genreId]: {
              data: animeWithTrailers,
              timestamp: Date.now(),
            },
          }))
        } else {
          setError("No anime with trailers found for this mood. Try again!")
        }
      } else {
        setError("No anime found for this mood. Try a different mood!")
      }
    } catch (err) {
      setError("An error occurred while fetching anime data. Please try again later.")
    }

    setLoading(false)
  }

  const handleMoodSelect = (mood: string, genreId: number) => {
    setSelectedMood(mood)
    fetchAnimeByMood(genreId)
  }

  const handlePreviousAnime = () => {
    setCurrentAnimeIndex((prevIndex) => (prevIndex > 0 ? prevIndex - 1 : recommendedAnime.length - 1))
  }

  const handleNextAnime = () => {
    setCurrentAnimeIndex((prevIndex) => (prevIndex < recommendedAnime.length - 1 ? prevIndex + 1 : 0))
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-200 to-blue-200 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold text-purple-800 mb-2">Mood2Anime</h1>
          <p className="text-xl text-purple-600">Discover your perfect anime based on your mood!</p>
        </div>
        <Card className="backdrop-blur-md bg-white/70 shadow-xl">
          <CardContent className="p-6">
            <div className="mb-8">
              <h2 className="text-2xl font-semibold mb-4 text-center text-purple-700">How are you feeling today?</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {moodEmojis.map(({ emoji, mood, genreId }) => (
                  <Button
                    key={mood}
                    variant={selectedMood === mood ? "default" : "outline"}
                    className={`text-lg p-4 h-auto flex flex-col items-center justify-center transition-all duration-300 ${
                      selectedMood === mood ? "bg-purple-500 text-white" : "hover:bg-purple-100"
                    }`}
                    onClick={() => handleMoodSelect(mood, genreId)}
                  >
                    <span className="text-4xl mb-2">{emoji}</span>
                    <span>{mood}</span>
                  </Button>
                ))}
              </div>
            </div>

            <AnimatePresence>
              {error && (
                <motion.p
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="mt-4 text-sm text-red-500 text-center"
                >
                  {error}
                </motion.p>
              )}

              {loading && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-center text-purple-600 flex items-center justify-center space-x-2"
                >
                  <Sparkles className="animate-spin" />
                  <span>Finding your perfect anime...</span>
                </motion.div>
              )}

              {recommendedAnime.length > 0 && (
                <motion.div
                  key={currentAnimeIndex}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  transition={{ duration: 0.5 }}
                  className="mt-8 space-y-6"
                >
                  <div className="bg-purple-100 p-6 rounded-lg shadow-md">
                    <h3 className="text-3xl font-bold text-purple-800 mb-4">{recommendedAnime[currentAnimeIndex].title}</h3>
                    <div className="flex flex-wrap gap-2 mb-4">
                      {recommendedAnime[currentAnimeIndex].genres.map((genre) => (
                        <Badge key={genre.name} variant="secondary" className="bg-purple-200 text-purple-800">
                          {genre.name}
                        </Badge>
                      ))}
                    </div>
                    <p className="text-sm text-purple-700 mb-4">{recommendedAnime[currentAnimeIndex].synopsis}</p>
                    <div className="grid grid-cols-2 gap-4 text-sm text-purple-600">
                      <div className="flex items-center">
                        <Star className="w-5 h-5 mr-2 text-yellow-500" />
                        <span>
                          <span className="font-semibold">Score:</span> {recommendedAnime[currentAnimeIndex].score}
                        </span>
                      </div>
                      <div>
                        <span className="font-semibold">Episodes:</span> {recommendedAnime[currentAnimeIndex].episodes}
                      </div>
                      <div className="col-span-2">
                        <span className="font-semibold">Aired:</span> {recommendedAnime[currentAnimeIndex].aired.string}
                      </div>
                    </div>
                  </div>
                  <div className="aspect-w-16 aspect-h-9 rounded-lg overflow-hidden shadow-lg">
                    <ReactPlayer
                      url={`https://www.youtube.com/watch?v=${recommendedAnime[currentAnimeIndex].trailer.youtube_id}`}
                      width="100%"
                      height="100%"
                      controls={true}
                    />
                  </div>
                  <div className="flex justify-between items-center mt-4">
                    <Button onClick={handlePreviousAnime} variant="outline" className="flex items-center">
                      <ChevronLeft className="mr-2" /> Previous Anime
                    </Button>
                    <Button onClick={handleNextAnime} variant="outline" className="flex items-center">
                      Next Anime <ChevronRight className="ml-2" />
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}