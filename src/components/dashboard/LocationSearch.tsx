'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { GAUGE_STATIONS, QUICK_LINKS } from '@/lib/constants'
import type { SearchResult, GaugeStation } from '@/lib/types'
import { cn, fuzzySearch } from '@/lib/utils'

interface LocationSearchProps {
  onSelect: (result: SearchResult) => void
}

export default function LocationSearch({ onSelect }: LocationSearchProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [isLocating, setIsLocating] = useState(false)
  const [gpsError, setGpsError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const debounceRef = useRef<NodeJS.Timeout | null>(null)

  // Build searchable items from gauges, towns, and rivers
  const buildSearchResults = useCallback((searchQuery: string): SearchResult[] => {
    if (!searchQuery.trim()) return []

    const lowerQuery = searchQuery.toLowerCase()
    const searchResults: SearchResult[] = []

    // Search gauges
    const matchingGauges = fuzzySearch(searchQuery, GAUGE_STATIONS as { name: string; stream?: string }[])
    matchingGauges.forEach((gauge) => {
      const station = gauge as GaugeStation
      searchResults.push({
        type: 'gauge',
        id: station.id,
        name: station.name,
        description: `${station.stream} - ${station.role}`,
        lat: station.lat,
        lng: station.lng,
      })
    })

    // Search towns from quick links
    QUICK_LINKS.forEach((location) => {
      if (location.name.toLowerCase().includes(lowerQuery)) {
        searchResults.push({
          type: 'town',
          id: `town-${location.name.toLowerCase()}`,
          name: location.name,
          description: 'Town',
          lat: location.lat,
          lng: location.lng,
        })
      }
    })

    // Search rivers (unique river systems from gauges)
    const rivers = new Map<string, { name: string; lat: number; lng: number }>()
    GAUGE_STATIONS.forEach((station) => {
      if (
        station.stream.toLowerCase().includes(lowerQuery) &&
        !rivers.has(station.stream)
      ) {
        rivers.set(station.stream, {
          name: station.stream,
          lat: station.lat,
          lng: station.lng,
        })
      }
    })
    rivers.forEach((river, streamName) => {
      searchResults.push({
        type: 'river',
        id: `river-${streamName.toLowerCase().replace(/\s+/g, '-')}`,
        name: streamName,
        description: 'River/Creek',
        lat: river.lat,
        lng: river.lng,
      })
    })

    return searchResults.slice(0, 10) // Limit to 10 results
  }, [])

  // Debounced search - responds within 200ms
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }

    debounceRef.current = setTimeout(() => {
      const searchResults = buildSearchResults(query)
      setResults(searchResults)
      setIsOpen(searchResults.length > 0)
    }, 150) // 150ms for responsiveness, well under 200ms target

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }
    }
  }, [query, buildSearchResults])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSelect = (result: SearchResult) => {
    setQuery(result.name)
    setIsOpen(false)
    onSelect(result)
  }

  const handleNearMe = () => {
    if (!navigator.geolocation) {
      setGpsError('Geolocation is not supported by your browser')
      return
    }

    setIsLocating(true)
    setGpsError(null)

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setIsLocating(false)
        const { latitude, longitude } = position.coords

        // Find nearest gauge
        let nearestGauge: GaugeStation | null = null
        let minDistance = Infinity

        for (const station of GAUGE_STATIONS) {
          const distance = Math.sqrt(
            Math.pow(station.lat - latitude, 2) + Math.pow(station.lng - longitude, 2)
          )
          if (distance < minDistance) {
            minDistance = distance
            nearestGauge = station
          }
        }

        if (nearestGauge) {
          const result: SearchResult = {
            type: 'gauge',
            id: nearestGauge.id,
            name: nearestGauge.name,
            description: `Nearest gauge - ${nearestGauge.stream}`,
            lat: nearestGauge.lat,
            lng: nearestGauge.lng,
          }
          setQuery(result.name)
          onSelect(result)
        }
      },
      (error) => {
        setIsLocating(false)
        switch (error.code) {
          case error.PERMISSION_DENIED:
            setGpsError('Location access denied. Please enable location services to use this feature.')
            break
          case error.POSITION_UNAVAILABLE:
            setGpsError('Location information unavailable. Please try again.')
            break
          case error.TIMEOUT:
            setGpsError('Location request timed out. Please try again.')
            break
          default:
            setGpsError('Unable to get your location. Please search manually.')
        }
      },
      {
        enableHighAccuracy: false,
        timeout: 10000,
        maximumAge: 300000, // 5 minutes cache
      }
    )
  }

  const getTypeIcon = (type: SearchResult['type']) => {
    switch (type) {
      case 'gauge':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        )
      case 'town':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
        )
      case 'river':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
          </svg>
        )
    }
  }

  return (
    <div className="relative w-full">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => results.length > 0 && setIsOpen(true)}
            placeholder="Find a location or river gauge"
            className={cn(
              'w-full px-4 py-3 pl-10 rounded-lg border border-gray-300',
              'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent',
              'bg-white text-gray-900 placeholder-gray-500',
              'text-base'
            )}
            aria-label="Search locations"
            aria-expanded={isOpen}
            aria-haspopup="listbox"
          />
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>

        <button
          onClick={handleNearMe}
          disabled={isLocating}
          className={cn(
            'px-4 py-3 rounded-lg border border-gray-300',
            'bg-white hover:bg-gray-50 active:bg-gray-100',
            'focus:outline-none focus:ring-2 focus:ring-blue-500',
            'transition-colors duration-150',
            'flex items-center gap-2',
            isLocating && 'opacity-50 cursor-not-allowed'
          )}
          aria-label="Use my location"
          title="Near Me"
        >
          {isLocating ? (
            <svg className="w-5 h-5 animate-spin text-blue-500" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          ) : (
            <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          )}
          <span className="hidden sm:inline text-sm font-medium text-gray-700">Near Me</span>
        </button>
      </div>

      {gpsError && (
        <div className="mt-2 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
          {gpsError}
        </div>
      )}

      {isOpen && results.length > 0 && (
        <div
          ref={dropdownRef}
          className={cn(
            'absolute z-50 w-full mt-1 bg-white rounded-lg shadow-lg',
            'border border-gray-200 max-h-80 overflow-auto'
          )}
          role="listbox"
        >
          {results.map((result) => (
            <button
              key={result.id}
              onClick={() => handleSelect(result)}
              className={cn(
                'w-full px-4 py-3 flex items-start gap-3 text-left',
                'hover:bg-gray-50 active:bg-gray-100',
                'border-b border-gray-100 last:border-b-0',
                'transition-colors duration-100'
              )}
              role="option"
            >
              <span className="mt-0.5 text-gray-400">{getTypeIcon(result.type)}</span>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 truncate">{result.name}</p>
                <p className="text-sm text-gray-500 truncate">{result.description}</p>
              </div>
              <span className="text-xs uppercase text-gray-400 font-medium mt-1">
                {result.type}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
