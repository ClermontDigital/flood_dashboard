'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { GAUGE_STATIONS, QUICK_LINKS } from '@/lib/constants'
import type { SearchResult, GaugeStation } from '@/lib/types'
import { cn, fuzzySearch } from '@/lib/utils'
import { sanitizeSearchQuery } from '@/lib/sanitize'
import { searchAddress, type GeocodingResult } from '@/lib/geocoding'

interface LocationSearchProps {
  onSelect: (result: SearchResult) => void
  onAddressSelect?: (location: { lat: number; lng: number; name: string }) => void
}

type CombinedResult = SearchResult | { type: 'address'; geocoding: GeocodingResult }

export default function LocationSearch({ onSelect, onAddressSelect }: LocationSearchProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<CombinedResult[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [isLocating, setIsLocating] = useState(false)
  const [isSearchingAddress, setIsSearchingAddress] = useState(false)
  const [gpsError, setGpsError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const debounceRef = useRef<NodeJS.Timeout | null>(null)
  const addressDebounceRef = useRef<NodeJS.Timeout | null>(null)

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

    return searchResults.slice(0, 5) // Limit gauge/river results to make room for addresses
  }, [])

  // Search for addresses via geocoding
  const searchAddresses = useCallback(async (searchQuery: string): Promise<CombinedResult[]> => {
    if (searchQuery.length < 4) return []

    setIsSearchingAddress(true)
    try {
      const response = await searchAddress(searchQuery)
      if (response.success && response.results.length > 0) {
        return response.results.slice(0, 3).map((result) => ({
          type: 'address' as const,
          geocoding: result,
        }))
      }
    } catch (error) {
      console.error('Address search error:', error)
    } finally {
      setIsSearchingAddress(false)
    }
    return []
  }, [])

  // Debounced search - responds within 200ms for local, longer for address
  useEffect(() => {
    // Sanitize the input
    const sanitizedQuery = sanitizeSearchQuery(query)

    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }
    if (addressDebounceRef.current) {
      clearTimeout(addressDebounceRef.current)
    }

    // Quick local search
    debounceRef.current = setTimeout(() => {
      const localResults = buildSearchResults(sanitizedQuery)
      setResults(localResults)
      setIsOpen(localResults.length > 0 || sanitizedQuery.length >= 4)
    }, 150)

    // Slower address geocoding search
    if (sanitizedQuery.length >= 4) {
      addressDebounceRef.current = setTimeout(async () => {
        const addressResults = await searchAddresses(sanitizedQuery)
        setResults((prev) => {
          const localOnly = prev.filter((r) => r.type !== 'address')
          return [...localOnly, ...addressResults]
        })
      }, 500)
    }

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
      if (addressDebounceRef.current) clearTimeout(addressDebounceRef.current)
    }
  }, [query, buildSearchResults, searchAddresses])

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

  const handleSelect = (result: CombinedResult) => {
    if (result.type === 'address') {
      const addr = result.geocoding
      // Shorten display name for the input
      const shortName = addr.displayName.split(',').slice(0, 3).join(', ')
      setQuery(shortName)
      setIsOpen(false)
      onAddressSelect?.({ lat: addr.lat, lng: addr.lng, name: shortName })
      // Also call onSelect with a synthetic result for map centering
      onSelect({
        type: 'town',
        id: `addr-${addr.lat}-${addr.lng}`,
        name: shortName,
        description: 'Address',
        lat: addr.lat,
        lng: addr.lng,
      })
    } else {
      setQuery(result.name)
      setIsOpen(false)
      onSelect(result)
    }
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

  const getTypeIcon = (type: CombinedResult['type']) => {
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
      case 'address':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
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
            placeholder="Search gauge, town, river, or address..."
            className={cn(
              'w-full px-4 py-3 pl-10 rounded-lg border border-gray-300',
              'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent',
              'bg-white text-gray-900 placeholder-gray-500',
              'text-base'
            )}
            role="combobox"
            aria-label="Search locations and addresses"
            aria-expanded={isOpen}
            aria-haspopup="listbox"
            aria-autocomplete="list"
            aria-controls="search-results-listbox"
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
          {isSearchingAddress && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <svg className="w-4 h-4 animate-spin text-blue-500" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            </div>
          )}
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

      {isOpen && (results.length > 0 || isSearchingAddress) && (
        <div
          ref={dropdownRef}
          id="search-results-listbox"
          className={cn(
            'absolute z-50 w-full mt-1 bg-white rounded-lg shadow-lg',
            'border border-gray-200 max-h-80 overflow-auto'
          )}
          role="listbox"
        >
          {results.length === 0 && isSearchingAddress ? (
            <div className="px-4 py-3 text-sm text-gray-500 flex items-center gap-2">
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Searching for addresses...
            </div>
          ) : (
            results.map((result, index) => {
              const isAddress = result.type === 'address'
              const displayName = isAddress ? result.geocoding.displayName : result.name
              const description = isAddress ? 'Address' : result.description

              return (
                <button
                  key={isAddress ? `addr-${index}` : result.id}
                  onClick={() => handleSelect(result)}
                  className={cn(
                    'w-full px-4 py-3 flex items-start gap-3 text-left',
                    'hover:bg-gray-50 active:bg-gray-100',
                    'border-b border-gray-100 last:border-b-0',
                    'transition-colors duration-100'
                  )}
                  role="option"
                  aria-selected={false}
                >
                  <span className="mt-0.5 text-gray-400">{getTypeIcon(result.type)}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">{displayName}</p>
                    <p className="text-sm text-gray-500 truncate">{description}</p>
                  </div>
                  <span className="text-xs uppercase text-gray-400 font-medium mt-1">
                    {result.type}
                  </span>
                </button>
              )
            })
          )}

          {query.length >= 4 && results.filter(r => r.type !== 'address').length > 0 && results.filter(r => r.type === 'address').length === 0 && !isSearchingAddress && (
            <div className="px-4 py-2 text-xs text-gray-400 border-t border-gray-100">
              Tip: Type a full address to search by street name
            </div>
          )}
        </div>
      )}
    </div>
  )
}
