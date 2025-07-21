import React, { useState, useEffect, useCallback } from 'react'
import { format, isToday, parseISO } from 'date-fns'
import { auth, provider, db } from './firebase'
import {
  signInWithRedirect,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  getRedirectResult
} from 'firebase/auth'
import {
  doc,
  setDoc,
  getDoc
} from 'firebase/firestore'

// Preset cricket RSS feeds organized by categories
const DEFAULT_CATEGORIES = {
  'News & Media': [
    { name: 'BBC Sport - Cricket', url: 'http://feeds.bbci.co.uk/sport/cricket/rss.xml', source: 'bbc.co.uk' },
    { name: 'Cricket news from ESPN Cricinfo.com', url: 'http://www.espncricinfo.com/rss/content/story/feeds/0.xml', source: 'espncricinfo.com' },
    { name: 'Cricket - The Guardian', url: 'https://www.theguardian.com/sport/cricket/rss', source: 'theguardian.com' },
    { name: 'Cricket – The Roar', url: 'https://www.theroar.com.au/cricket/feed/', source: 'theroar.com.au' },
    { name: 'NDTV Sports - Cricket', url: 'http://feeds.feedburner.com/ndtvsports-cricket', source: 'ndtv.com' },
    { name: 'Wisden', url: 'https://www.wisden.com/feed', source: 'wisden.com' }
  ],
  'Podcasts': [
    { name: "Can't Bowl Can't Throw Cricket Show", url: 'http://feeds.feedburner.com/cantbowlcantthrow', source: 'player.whooshkaa.com' },
    { name: 'Cricket Unfiltered', url: 'https://rss.acast.com/cricket-unfiltered', source: 'piccolopodcasts.com.au' },
    { name: 'Sky Sports Cricket Podcast', url: 'https://www.spreaker.com/show/3387348/episodes/feed', source: 'spreaker.com' },
    { name: 'Stumped', url: 'https://podcasts.files.bbci.co.uk/p02gsrmh.rss', source: 'bbc.co.uk' },
    { name: 'Switch Hit Podcast', url: 'https://feeds.megaphone.fm/ESP9247246951', source: 'espn.com' },
    { name: 'Tailenders', url: 'https://podcasts.files.bbci.co.uk/p02pcb4w.rss', source: 'bbc.co.uk' },
    { name: 'Test Match Special', url: 'https://podcasts.files.bbci.co.uk/p02nrsl2.rss', source: 'bbc.co.uk' },
    { name: 'The Analyst Inside Cricket', url: 'http://rss.acast.com/theanalystinsidecricket', source: 'theanalyst.net' },
    { name: 'The Grade Cricketer', url: 'https://rss.whooshkaa.com/rss/podcast/id/1308', source: 'gradecricketer.club' },
    { name: 'Wisden Cricket Weekly', url: 'http://feeds.soundcloud.com/users/soundcloud:users:341034518/sounds.rss', source: 'wisden.com' }
  ],
  'YouTube Channels': [
    { name: 'Cricbuzz', url: 'https://www.youtube.com/feeds/videos.xml?channel_id=UCSRQXk5yErn4e14vN76upOw', source: 'youtube.com' },
    { name: 'England & Wales Cricket Board', url: 'https://www.youtube.com/feeds/videos.xml?user=ecbcricket', source: 'youtube.com' },
    { name: 'Pakistan Cricket', url: 'https://www.youtube.com/feeds/videos.xml?channel_id=UCiWrjBhlICf_L_RK5y6Vrxw', source: 'youtube.com' },
    { name: 'Sri Lanka Cricket', url: 'https://www.youtube.com/feeds/videos.xml?user=TheOfficialSLC', source: 'youtube.com' },
    { name: 'cricket.com.au', url: 'https://www.youtube.com/feeds/videos.xml?user=cricketaustraliatv', source: 'youtube.com' }
  ],
  'Community': [
    { name: 'Cricket', url: 'https://www.reddit.com/r/Cricket/.rss', source: 'reddit.com' }
  ]
}

// Cricket-specific keywords for tagging
const CRICKET_KEYWORDS = {
  'Teams': ['england', 'australia', 'india', 'pakistan', 'south africa', 'new zealand', 'west indies', 'sri lanka', 'bangladesh', 'afghanistan', 'ireland', 'zimbabwe'],
  'Players': ['virat kohli', 'steve smith', 'ben stokes', 'joe root', 'kane williamson', 'babar azam', 'rohit sharma', 'pat cummins', 'james anderson', 'stuart broad'],
  'Tournaments': ['ashes', 'world cup', 'ipl', 't20', 'test match', 'odi', 'champions trophy', 'bbl', 'psl', 'cpl'],
  'Events': ['match', 'series', 'tour', 'final', 'semi-final', 'quarter-final', 'playoff', 'championship'],
  'Skills': ['batting', 'bowling', 'fielding', 'wicket', 'run', 'catch', 'stump', 'lbw', 'six', 'four', 'century', 'fifty'],
  'Venues': ['lords', 'mcg', 'eden gardens', 'wankhede', 'old trafford', 'trent bridge', 'headingley', 'oval'],
  'Formats': ['test cricket', 'one day', 't20', 'first class', 'list a', 't20i', 'odi'],
  'News': ['transfer', 'contract', 'injury', 'retirement', 'appointment', 'resignation', 'suspension', 'ban'],
  'Analysis': ['stats', 'statistics', 'analysis', 'commentary', 'review', 'preview', 'prediction', 'forecast'],
  'Media': ['interview', 'press conference', 'statement', 'announcement', 'report', 'exclusive']
}

function App() {
  const [feedUrl, setFeedUrl] = useState('')
  const [feedName, setFeedName] = useState('')
  const [feedData, setFeedData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [categories, setCategories] = useState(DEFAULT_CATEGORIES)
  const [showAddForm, setShowAddForm] = useState(false)
  const [showAddCategoryForm, setShowAddCategoryForm] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('News & Media')
  const [user, setUser] = useState(null)
  const [readArticles, setReadArticles] = useState(() => {
    try {
      const stored = localStorage.getItem('deepextracover_read_articles')
      return stored ? new Set(JSON.parse(stored)) : new Set()
    } catch {
      return new Set()
    }
  })
  const [firestoreLoaded, setFirestoreLoaded] = useState(false)
  const [selectedTag, setSelectedTag] = useState(null)
  const [allArticles, setAllArticles] = useState([])
  const [tagCounts, setTagCounts] = useState({})
  const [feedStats, setFeedStats] = useState({})

  // Google Auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser)
      if (firebaseUser) {
        // Always load from Firestore and override local state
        const userDoc = doc(db, 'users', firebaseUser.uid)
        const snap = await getDoc(userDoc)
        if (snap.exists() && snap.data().readArticles) {
          setReadArticles(new Set(snap.data().readArticles))
        } else {
          setReadArticles(new Set())
        }
        setFirestoreLoaded(true)
      } else {
        // Load from localStorage
        const stored = localStorage.getItem('deepextracover_read_articles')
        setReadArticles(stored ? new Set(JSON.parse(stored)) : new Set())
        setFirestoreLoaded(true)
      }
    })
    return () => unsubscribe()
  }, [])

  useEffect(() => {
    getRedirectResult(auth).catch((error) => {
      // Optionally log or handle the error
      console.error('Google sign-in redirect error:', error)
    })
  }, [])

  // Save readArticles to Firestore or localStorage
  useEffect(() => {
    if (!firestoreLoaded) return
    if (user) {
      // Save to Firestore
      const userDoc = doc(db, 'users', user.uid)
      setDoc(userDoc, { readArticles: Array.from(readArticles) }, { merge: true })
    } else {
      // Save to localStorage
      localStorage.setItem('deepextracover_read_articles', JSON.stringify(Array.from(readArticles)))
    }
  }, [readArticles, user, firestoreLoaded])

  // Sign in/out handlers
  const signIn = useCallback(() => signInWithRedirect(auth, provider), [])
  const signOut = useCallback(() => firebaseSignOut(auth), [])

  useEffect(() => {
    localStorage.setItem('deepextracover_read_articles', JSON.stringify(Array.from(readArticles)))
  }, [readArticles])

  const extractTags = (title, description) => {
    const text = `${title} ${description}`.toLowerCase()
    const tags = new Set()
    
    // Extract tags from predefined categories
    Object.entries(CRICKET_KEYWORDS).forEach(([category, keywords]) => {
      keywords.forEach(keyword => {
        if (text.includes(keyword.toLowerCase())) {
          tags.add(keyword.toLowerCase())
        }
      })
    })
    
    // Extract common cricket terms
    const commonTerms = [
      'cricket', 'bat', 'ball', 'pitch', 'ground', 'stadium', 'captain', 'coach', 'selector',
      'umpire', 'referee', 'batsman', 'bowler', 'all-rounder', 'wicket-keeper', 'opener',
      'middle order', 'tail', 'fast bowler', 'spinner', 'pace', 'spin', 'seam', 'swing',
      'reverse swing', 'googly', 'leg spin', 'off spin', 'yorker', 'bouncer', 'full toss',
      'no ball', 'wide', 'bye', 'leg bye', 'extras', 'declaration', 'follow-on', 'innings',
      'over', 'maiden over', 'powerplay', 'super over', 'drs', 'hawkeye', 'hotspot'
    ]
    
    commonTerms.forEach(term => {
      if (text.includes(term.toLowerCase())) {
        tags.add(term.toLowerCase())
      }
    })
    
    return Array.from(tags).slice(0, 5) // Limit to 5 tags per article
  }

  const updateTagCounts = (articles) => {
    const counts = {}
    articles.forEach(article => {
      article.tags.forEach(tag => {
        counts[tag] = (counts[tag] || 0) + 1
      })
    })
    setTagCounts(counts)
  }

  const getPopularTags = () => {
    return Object.entries(tagCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 20) // Show top 20 tags
      .map(([tag]) => tag)
  }

  const calculateFeedStats = (articles, feedUrl) => {
    const today = new Date()
    let newToday = 0
    let readCount = 0
    let unreadCount = 0

    articles.forEach(article => {
      try {
        const articleDate = parseISO(article.pubDate)
        if (isToday(articleDate)) {
          newToday++
        }
      } catch (error) {
        // If date parsing fails, skip this article for today's count
      }

      const articleId = getArticleId(article)
      if (readArticles.has(articleId)) {
        readCount++
      } else {
        unreadCount++
      }
    })

    return {
      newToday,
      readCount,
      unreadCount,
      total: articles.length
    }
  }

  const fetchRSSFeed = async (url) => {
    setLoading(true)
    setError(null)
    
    try {
      // Use a CORS proxy to avoid CORS issues
      const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`
      const response = await fetch(proxyUrl)
      const data = await response.json()
      
      if (!data.contents) {
        throw new Error('Failed to fetch RSS feed')
      }

      // Parse the XML content
      const parser = new DOMParser()
      const xmlDoc = parser.parseFromString(data.contents, 'text/xml')
      
      // Extract feed information
      const title = xmlDoc.querySelector('channel > title')?.textContent || 'Unknown Feed'
      const description = xmlDoc.querySelector('channel > description')?.textContent || ''
      const link = xmlDoc.querySelector('channel > link')?.textContent || ''
      
      // Extract articles
      const items = xmlDoc.querySelectorAll('item')
      const articles = Array.from(items).map(item => {
        const articleTitle = item.querySelector('title')?.textContent || 'No Title'
        const articleDescription = item.querySelector('description')?.textContent || ''
        const tags = extractTags(articleTitle, articleDescription)
        
        return {
          title: articleTitle,
          description: articleDescription,
          link: item.querySelector('link')?.textContent || '',
          pubDate: item.querySelector('pubDate')?.textContent || '',
          author: item.querySelector('author')?.textContent || 'Unknown',
          tags: tags
        }
      })

      setFeedData({
        title,
        description,
        link,
        articles
      })
      
      // Update all articles and tag counts
      setAllArticles(articles)
      updateTagCounts(articles)
      
      // Calculate and store feed statistics
      const stats = calculateFeedStats(articles, url)
      setFeedStats(prev => ({
        ...prev,
        [url]: stats
      }))
    } catch (err) {
      setError(`Error fetching RSS feed: ${err.message}`)
      setFeedData(null)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (feedUrl.trim()) {
      fetchRSSFeed(feedUrl.trim())
    }
  }

  const handlePresetFeed = (url) => {
    setFeedUrl(url)
    fetchRSSFeed(url)
  }

  const addFeed = () => {
    if (feedName.trim() && feedUrl.trim() && selectedCategory) {
      const newFeed = {
        name: feedName.trim(),
        url: feedUrl.trim(),
        source: 'custom'
      }
      
      setCategories(prev => ({
        ...prev,
        [selectedCategory]: [...(prev[selectedCategory] || []), newFeed]
      }))
      
      setFeedName('')
      setFeedUrl('')
      setShowAddForm(false)
    }
  }

  const removeFeed = (categoryName, feedIndex) => {
    setCategories(prev => ({
      ...prev,
      [categoryName]: prev[categoryName].filter((_, index) => index !== feedIndex)
    }))
  }

  const addCategory = () => {
    if (newCategoryName.trim()) {
      setCategories(prev => ({
        ...prev,
        [newCategoryName.trim()]: []
      }))
      setNewCategoryName('')
      setShowAddCategoryForm(false)
      setSelectedCategory(newCategoryName.trim())
    }
  }

  const removeCategory = (categoryName) => {
    const newCategories = { ...categories }
    delete newCategories[categoryName]
    setCategories(newCategories)
    
    // If the removed category was selected, switch to first available category
    if (selectedCategory === categoryName) {
      const remainingCategories = Object.keys(newCategories)
      if (remainingCategories.length > 0) {
        setSelectedCategory(remainingCategories[0])
      }
    }
  }

  const toggleReadStatus = (articleId) => {
    setReadArticles(prev => {
      const newSet = new Set(prev)
      if (newSet.has(articleId)) {
        newSet.delete(articleId)
      } else {
        newSet.add(articleId)
      }
      return newSet
    })
    
    // Update feed stats when read status changes
    if (feedData) {
      const stats = calculateFeedStats(feedData.articles, feedData.link)
      setFeedStats(prev => ({
        ...prev,
        [feedData.link]: stats
      }))
    }
  }

  const handleTagClick = (tag) => {
    setSelectedTag(selectedTag === tag ? null : tag)
  }

  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString)
      return format(date, 'MMM dd, yyyy HH:mm')
    } catch {
      return 'Unknown date'
    }
  }

  const stripHtml = (html) => {
    const tmp = document.createElement('div')
    tmp.innerHTML = html
    return tmp.textContent || tmp.innerText || ''
  }

  const getArticleId = (article) => {
    return `${article.title}-${article.pubDate}-${article.link}`
  }

  const sortArticles = (articles) => {
    return articles.sort((a, b) => {
      const aRead = readArticles.has(getArticleId(a))
      const bRead = readArticles.has(getArticleId(b))
      
      // Unread articles first, then read articles
      if (aRead && !bRead) return 1
      if (!aRead && bRead) return -1
      
      // Within each group, sort by date (newest first)
      const aDate = new Date(a.pubDate)
      const bDate = new Date(b.pubDate)
      return bDate - aDate
    })
  }

  const filterArticlesByTag = (articles) => {
    if (!selectedTag) return articles
    return articles.filter(article => article.tags.includes(selectedTag))
  }

  const displayArticles = selectedTag ? filterArticlesByTag(allArticles) : (feedData?.articles || [])

  return (
    <div className="app-container">
      <div className="sidebar">
        <div className="sidebar-header">
          <h3>Popular Tags</h3>
          {selectedTag && (
            <button 
              className="clear-filter"
              onClick={() => setSelectedTag(null)}
            >
              Clear Filter
            </button>
          )}
        </div>
        <div className="tags-list">
          {getPopularTags().map(tag => (
            <button
              key={tag}
              className={`tag ${selectedTag === tag ? 'selected' : ''}`}
              onClick={() => handleTagClick(tag)}
            >
              {tag} ({tagCounts[tag]})
            </button>
          ))}
          {getPopularTags().length === 0 && (
            <p className="no-tags">No tags available. Load a feed to see tags.</p>
          )}
        </div>
      </div>

      <div className="main-content">
        <div className="container">
          <div className="header">
            <h1>Deep Extra Cover</h1>
            <p>Stay updated with the latest cricket news and updates</p>
            <div style={{ margin: '20px 0' }}>
              {user ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <img src={user.photoURL} alt="avatar" style={{ width: 40, height: 40, borderRadius: '50%' }} />
                  <span style={{ fontWeight: 600, fontSize: 20 }}>{user.displayName}</span>
                  <span style={{ fontWeight: 500, fontSize: 18, color: '#28a745', marginLeft: 12 }}>
                    Welcome, {user.displayName}!
                  </span>
                  <button onClick={signOut} style={{ padding: '8px 20px', borderRadius: 4, border: 'none', background: '#333', color: '#fff', cursor: 'pointer', fontSize: 16 }}>Sign out</button>
                </div>
              ) : (
                <button onClick={signIn} style={{ padding: '8px 20px', borderRadius: 4, border: 'none', background: '#4285F4', color: '#fff', fontWeight: 500, cursor: 'pointer', fontSize: 16 }}>Sign in with Google</button>
              )}
            </div>
            {selectedTag && (
              <div className="active-filter">
                <span>Filtering by: <strong>{selectedTag}</strong></span>
              </div>
            )}
          </div>

          <div className="feed-controls">
            <form onSubmit={handleSubmit} className="feed-input">
              <input
                type="url"
                value={feedUrl}
                onChange={(e) => setFeedUrl(e.target.value)}
                placeholder="Enter RSS feed URL..."
                required
              />
              <button type="submit" disabled={loading}>
                {loading ? 'Loading...' : 'Load Feed'}
              </button>
            </form>

            <div className="feed-management">
              <div className="feed-management-header">
                <div className="category-controls">
                  <select 
                    value={selectedCategory} 
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="category-select"
                  >
                    {Object.keys(categories).map(category => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                  <button 
                    className="add-category-btn"
                    onClick={() => setShowAddCategoryForm(!showAddCategoryForm)}
                  >
                    {showAddCategoryForm ? 'Cancel' : 'Add Category'}
                  </button>
                </div>
                <button 
                  className="add-feed-btn"
                  onClick={() => setShowAddForm(!showAddForm)}
                >
                  {showAddForm ? 'Cancel' : 'Add Feed'}
                </button>
              </div>

              {showAddCategoryForm && (
                <div className="add-category-form">
                  <input
                    type="text"
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    placeholder="Category name..."
                    className="category-name-input"
                  />
                  <button onClick={addCategory} className="add-category-submit">
                    Add Category
                  </button>
                </div>
              )}

              {showAddForm && (
                <div className="add-feed-form">
                  <input
                    type="text"
                    value={feedName}
                    onChange={(e) => setFeedName(e.target.value)}
                    placeholder="Feed name..."
                    className="feed-name-input"
                  />
                  <input
                    type="url"
                    value={feedUrl}
                    onChange={(e) => setFeedUrl(e.target.value)}
                    placeholder="RSS feed URL..."
                    className="feed-url-input"
                  />
                  <button onClick={addFeed} className="add-feed-submit">
                    Add Feed
                  </button>
                </div>
              )}

              <div className="category-header">
                <h3>{selectedCategory}</h3>
                {Object.keys(categories).length > 1 && (
                  <button
                    className="remove-category"
                    onClick={() => removeCategory(selectedCategory)}
                    title="Remove category"
                  >
                    Remove Category
                  </button>
                )}
              </div>

              <div className="preset-feeds">
                {categories[selectedCategory]?.map((feed, index) => {
                  const stats = feedStats[feed.url] || { newToday: 0, readCount: 0, unreadCount: 0, total: 0 }
                  
                  return (
                    <div key={index} className="feed-item">
                      <div className="feed-info-container">
                        <button
                          className="preset-feed"
                          onClick={() => handlePresetFeed(feed.url)}
                          disabled={loading}
                        >
                          <div className="feed-name">{feed.name}</div>
                          <div className="feed-stats">
                            <span className="stat new-today" title="New articles today">
                              {stats.newToday > 0 && `+${stats.newToday}`}
                            </span>
                            <span className="stat unread" title="Unread articles">
                              {stats.unreadCount > 0 && `${stats.unreadCount} unread`}
                            </span>
                            <span className="stat read" title="Read articles">
                              {stats.readCount > 0 && `${stats.readCount} read`}
                            </span>
                          </div>
                        </button>
                        <button
                          className="remove-feed"
                          onClick={() => removeFeed(selectedCategory, index)}
                          title="Remove feed"
                        >
                          ×
                        </button>
                      </div>
                    </div>
                  )
                })}
                {(!categories[selectedCategory] || categories[selectedCategory].length === 0) && (
                  <p className="no-feeds">No feeds in this category. Add some feeds to get started!</p>
                )}
              </div>
            </div>
          </div>

          {error && (
            <div className="error">
              {error}
            </div>
          )}

          {loading && (
            <div className="feed-content">
              <div className="loading">
                <p>Loading cricket updates...</p>
              </div>
            </div>
          )}

          {feedData && !loading && (
            <div className="feed-content">
              <div className="feed-info">
                <h2>{feedData.title}</h2>
                {feedData.description && (
                  <p>{stripHtml(feedData.description)}</p>
                )}
                {feedData.link && (
                  <a href={feedData.link} target="_blank" rel="noopener noreferrer" className="article-link">
                    Visit Source
                  </a>
                )}
                {feedStats[feedData.link] && (
                  <div className="current-feed-stats">
                    <span className="stat-item">
                      <strong>Today:</strong> {feedStats[feedData.link].newToday} new
                    </span>
                    <span className="stat-item">
                      <strong>Unread:</strong> {feedStats[feedData.link].unreadCount}
                    </span>
                    <span className="stat-item">
                      <strong>Read:</strong> {feedStats[feedData.link].readCount}
                    </span>
                    <span className="stat-item">
                      <strong>Total:</strong> {feedStats[feedData.link].total}
                    </span>
                  </div>
                )}
              </div>

              <div className="articles">
                {sortArticles(displayArticles).map((article, index) => {
                  const articleId = getArticleId(article)
                  const isRead = readArticles.has(articleId)
                  
                  return (
                    <div key={index} className={`article ${isRead ? 'read' : 'unread'}`}>
                      <div className="article-header">
                        <div className="article-tags">
                          {article.tags.map(tag => (
                            <span key={tag} className="article-tag">{tag}</span>
                          ))}
                        </div>
                        <label className="read-checkbox">
                          <input
                            type="checkbox"
                            checked={isRead}
                            onChange={() => toggleReadStatus(articleId)}
                          />
                          <span className="checkmark"></span>
                          <span className="read-label">{isRead ? 'Read' : 'Unread'}</span>
                        </label>
                      </div>
                      
                      <div className="article-meta">
                        <span className="article-date">
                          {formatDate(article.pubDate)}
                        </span>
                        <span>By {article.author}</span>
                      </div>
                      
                      <h3>{article.title}</h3>
                      
                      {article.description && (
                        <div className="article-description">
                          {stripHtml(article.description).substring(0, 200)}
                          {article.description.length > 200 && '...'}
                        </div>
                      )}
                      
                      {article.link && (
                        <a 
                          href={article.link} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="read-more"
                        >
                          Read Full Article
                        </a>
                      )}
                    </div>
                  )
                })}
                {displayArticles.length === 0 && (
                  <p className="no-articles">No articles found with the selected tag.</p>
                )}
              </div>
            </div>
          )}

          {!feedData && !loading && !error && (
            <div className="feed-content">
              <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
                <p>Enter an RSS feed URL above or select a preset feed to get started!</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default App 