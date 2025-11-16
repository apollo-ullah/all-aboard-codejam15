import { ScrapedData, ScrapeResult } from '../types/index';

/**
 * TestDataService - Provides mock scraped data for testing when Browser.cash API is down
 */

export class TestDataService {
  /**
   * Get test data for Airbnb
   */
  static getAirbnbTestData(): ScrapedData {
    const mainPage: ScrapeResult = {
      url: 'https://www.airbnb.com',
      title: 'Airbnb: Vacation Rentals, Cabins, Beach Houses, Unique Homes & Experiences',
      content: `Airbnb is a global online marketplace and hospitality service that enables people to list, discover, and book unique accommodations and experiences around the world.

Founded in 2008 by Brian Chesky, Joe Gebbia, and Nathan Blecharczyk, Airbnb has revolutionized the travel and hospitality industry by connecting travelers with local hosts who offer everything from spare rooms to entire homes, castles, treehouses, and more.

KEY FEATURES:
- Over 7 million listings worldwide in more than 220 countries and regions
- Unique accommodations including apartments, houses, villas, boats, and unique stays
- Experiences hosted by locals offering authentic cultural activities
- Flexible booking options with instant booking and flexible cancellation policies
- Host protection insurance and 24/7 customer support
- Verified listings with photos, reviews, and detailed descriptions
- Secure payment processing with multiple payment methods
- Mobile apps for iOS and Android for easy booking on the go

BUSINESS MODEL:
Airbnb operates on a commission-based model, taking a percentage from both hosts and guests. Hosts typically pay a 3% service fee, while guests pay a service fee (usually 6-12% of the booking subtotal).

IMPACT:
- Empowers millions of hosts to earn income from their properties
- Provides travelers with authentic, local experiences
- Contributes to local economies by distributing tourism revenue
- Promotes sustainable travel and cultural exchange
- Created the "sharing economy" model for accommodations

TECHNOLOGY:
- Advanced search and filtering algorithms
- Machine learning for personalized recommendations
- Dynamic pricing tools for hosts
- Secure payment processing
- Real-time messaging between hosts and guests
- Review and rating system for trust and safety

MARKET POSITION:
Airbnb is one of the world's largest accommodation platforms, competing with traditional hotels and other short-term rental platforms. The company went public in 2020 and continues to expand its offerings with Airbnb Experiences, Airbnb Plus, and Airbnb Luxe.`,
      metadata: {
        description: 'Find vacation rentals, cabins, beach houses, unique homes and experiences around the world - all in one place.',
        ogTitle: 'Airbnb: Vacation Rentals, Cabins, Beach Houses, Unique Homes & Experiences',
        ogDescription: 'Book unique places to stay and things to do'
      },
      links: [
        'https://www.airbnb.com/s/homes',
        'https://www.airbnb.com/experiences',
        'https://www.airbnb.com/host/homes',
        'https://www.airbnb.com/about',
        'https://www.airbnb.com/help',
        'https://www.airbnb.com/press/news',
        'https://www.airbnb.com/plus',
        'https://www.airbnb.com/luxury'
      ]
    };

    const adjacentPages: ScrapeResult[] = [
      {
        url: 'https://www.airbnb.com/s/homes',
        title: 'Airbnb - Vacation Rentals & Places to Stay',
        content: `Search millions of homes and unique places to stay around the world. Filter by price, location, amenities, and more to find the perfect accommodation for your trip.

FEATURES:
- Advanced search filters (price, location, dates, guests, amenities)
- Map view to see listings geographically
- Saved lists and wishlists
- Instant booking options
- Flexible cancellation policies
- Verified listings with photos and reviews
- Host profiles and communication tools

POPULAR DESTINATIONS:
- Paris, France
- Tokyo, Japan
- New York, USA
- London, UK
- Barcelona, Spain
- Rome, Italy
- Bali, Indonesia
- Sydney, Australia`,
        metadata: {
          description: 'Find the perfect place to stay at an amazing price in 191 countries. Belong anywhere with Airbnb.',
          ogTitle: 'Airbnb - Vacation Rentals & Places to Stay',
          ogDescription: 'Find the perfect place to stay at an amazing price'
        },
        links: [
          'https://www.airbnb.com/experiences',
          'https://www.airbnb.com/host/homes',
          'https://www.airbnb.com/about'
        ]
      },
      {
        url: 'https://www.airbnb.com/experiences',
        title: 'Airbnb Experiences - Things to Do',
        content: `Discover unique experiences hosted by locals around the world. From cooking classes to city tours, outdoor adventures to cultural immersions.

EXPERIENCE CATEGORIES:
- Food & Drink: Cooking classes, wine tastings, local dining
- Nature & Outdoors: Hiking, kayaking, wildlife watching
- Arts & Culture: Art workshops, museum tours, cultural experiences
- Sports & Wellness: Yoga, surfing, fitness classes
- Entertainment: Concerts, shows, nightlife experiences
- History & Heritage: Historical tours, cultural sites

BENEFITS:
- Hosted by verified local experts
- Small group sizes for personalized experiences
- Unique activities not available elsewhere
- Instant booking and flexible cancellation
- Reviews and ratings from previous guests
- Support for local communities and creators`,
        metadata: {
          description: 'Book unique experiences hosted by locals around the world',
          ogTitle: 'Airbnb Experiences - Things to Do',
          ogDescription: 'Book unique experiences hosted by locals'
        },
        links: [
          'https://www.airbnb.com/s/homes',
          'https://www.airbnb.com/host/experiences'
        ]
      },
      {
        url: 'https://www.airbnb.com/host/homes',
        title: 'Airbnb: Host Your Home',
        content: `Become an Airbnb host and earn money by sharing your space. Join millions of hosts worldwide who are earning extra income.

HOST BENEFITS:
- Earn money from your extra space
- Set your own price and availability
- Host protection insurance included
- 24/7 support for hosts
- Tools and resources to help you succeed
- Access to millions of potential guests
- Flexible hosting options (entire place, private room, shared room)

HOST REQUIREMENTS:
- Clean, comfortable space
- Accurate listing description and photos
- Responsive communication with guests
- Basic amenities (WiFi, linens, etc.)
- Compliance with local regulations

EARNING POTENTIAL:
- Average host earns $9,600 per year
- Top hosts earn significantly more
- Income varies by location, property type, and availability
- Dynamic pricing tools help maximize earnings`,
        metadata: {
          description: 'Become an Airbnb host and earn money by sharing your space',
          ogTitle: 'Airbnb: Host Your Home',
          ogDescription: 'Earn money by sharing your space'
        },
        links: [
          'https://www.airbnb.com/host/experiences',
          'https://www.airbnb.com/about'
        ]
      },
      {
        url: 'https://www.airbnb.com/about',
        title: 'About Airbnb - How We Started',
        content: `Airbnb was founded in 2008 when two designers who had space to share hosted three travelers looking for a place to stay. Now, millions of hosts and travelers choose to create a free Airbnb account so they can list their space and book unique accommodations anywhere in the world.

OUR MISSION:
To create a world where anyone can belong anywhere. We're building a global community where people can share their homes, experiences, and passions.

KEY STATISTICS:
- 7+ million listings worldwide
- 220+ countries and regions
- 1.5+ billion guest arrivals
- 4+ million hosts globally
- 100,000+ cities with listings

COMPANY VALUES:
- Belonging: Everyone should feel welcome
- Trust: Building trust through transparency
- Community: Supporting local communities
- Sustainability: Promoting sustainable travel
- Innovation: Continuously improving the platform

LEADERSHIP:
- Brian Chesky: Co-founder and CEO
- Joe Gebbia: Co-founder
- Nathan Blecharczyk: Co-founder and Chief Strategy Officer`,
        metadata: {
          description: 'Learn about Airbnb, how we started, and our mission to create a world where anyone can belong anywhere',
          ogTitle: 'About Airbnb',
          ogDescription: 'Learn about Airbnb and our mission'
        },
        links: [
          'https://www.airbnb.com/press/news',
          'https://www.airbnb.com/help'
        ]
      },
      {
        url: 'https://www.airbnb.com/plus',
        title: 'Airbnb Plus - Verified Quality Homes',
        content: `Airbnb Plus is a selection of only the highest quality homes with hosts known for great reviews and attention to detail. Every Plus home is verified through in-person quality inspection.

PLUS FEATURES:
- Verified quality through in-person inspection
- Beautiful, well-designed spaces
- Hosts with excellent reviews
- Premium amenities and thoughtful touches
- Fast response times from hosts
- Enhanced photography and listing quality

QUALITY STANDARDS:
- Clean, well-maintained properties
- Comfortable and stylish interiors
- Essential amenities (WiFi, kitchen, etc.)
- Accurate listing descriptions
- Professional photography
- Responsive hosts with great reviews

BENEFITS FOR GUESTS:
- Confidence in quality and cleanliness
- Beautiful, Instagram-worthy spaces
- Consistent high standards
- Premium experience at competitive prices
- Priority customer support`,
        metadata: {
          description: 'Verified quality homes with hosts known for great reviews',
          ogTitle: 'Airbnb Plus - Verified Quality Homes',
          ogDescription: 'Verified quality homes with hosts known for great reviews'
        },
        links: [
          'https://www.airbnb.com/luxury',
          'https://www.airbnb.com/s/homes'
        ]
      }
    ];

    return {
      mainPage,
      adjacentPages
    };
  }

  /**
   * Get test data for YouTube
   */
  static getYouTubeTestData(): ScrapedData {
    const mainPage: ScrapeResult = {
      url: 'https://www.youtube.com',
      title: 'YouTube - Watch, Share, and Create Videos',
      content: `YouTube is the world's largest video-sharing platform, enabling billions of users to discover, watch, and share original videos. Founded in 2005 and acquired by Google in 2006, YouTube has revolutionized how people consume and create content.

KEY FEATURES:
- Over 2 billion logged-in monthly users worldwide
- 500+ hours of video uploaded every minute
- Support for videos up to 12 hours long (or unlimited for verified accounts)
- Live streaming capabilities with real-time interaction
- YouTube Shorts for vertical, mobile-first video content
- YouTube Premium for ad-free viewing and offline downloads
- YouTube Music for streaming music and music videos
- Creator Studio for content management and analytics
- Monetization through YouTube Partner Program
- Community features: comments, likes, shares, playlists, subscriptions

CONTENT ECOSYSTEM:
- Music videos and official artist channels
- Educational content and tutorials
- Gaming and live streams
- Vlogs and lifestyle content
- News and current events
- Product reviews and unboxings
- Cooking and recipe videos
- Fitness and wellness content
- Tech reviews and demos
- Comedy and entertainment

MONETIZATION:
- Ad revenue sharing through YouTube Partner Program
- Channel memberships and Super Chat
- Merchandise shelf integration
- YouTube Premium revenue share
- Brand partnerships and sponsorships

TECHNOLOGY:
- Advanced recommendation algorithm using machine learning
- Content ID system for copyright protection
- Real-time analytics and insights for creators
- Multi-platform support (web, mobile apps, smart TVs, gaming consoles)
- 4K, 8K, and HDR video support
- Live chat and community features
- Automatic captions and translations

IMPACT:
- Empowers millions of creators to build careers and businesses
- Provides free education and entertainment to billions
- Enables businesses to reach global audiences
- Supports independent artists and musicians
- Facilitates knowledge sharing and learning
- Creates new forms of entertainment and media

STATISTICS:
- Over 1 billion hours of video watched daily
- Available in 100+ countries and 80+ languages
- 70% of watch time comes from mobile devices
- YouTube Kids provides safe content for children
- YouTube TV offers live TV streaming service`,
      metadata: {
        description: 'Enjoy the videos and music you love, upload original content, and share it all with friends, family, and the world on YouTube.',
        ogTitle: 'YouTube',
        ogDescription: 'Enjoy the videos and music you love, upload original content, and share it all with friends, family, and the world on YouTube.'
      },
      links: [
        'https://www.youtube.com/about',
        'https://www.youtube.com/creators',
        'https://www.youtube.com/premium',
        'https://www.youtube.com/music',
        'https://www.youtube.com/tv',
        'https://www.youtube.com/kids'
      ]
    };

    const adjacentPages: ScrapeResult[] = [
      {
        url: 'https://www.youtube.com/about',
        title: 'About YouTube',
        content: `YouTube's mission is to give everyone a voice and show them the world. We believe that everyone deserves to have a voice, and that the world is a better place when we listen, share, and build community through our stories.

COMPANY HISTORY:
- Founded in 2005 by Chad Hurley, Steve Chen, and Jawed Karim
- Acquired by Google in 2006 for $1.65 billion
- Headquartered in San Bruno, California
- Part of Alphabet Inc. (Google's parent company)

OUR VALUES:
- Freedom of expression
- Opportunity for all creators
- Responsibility to our community
- Innovation in video technology
- Global reach and accessibility

COMMITMENT:
- Supporting creators and artists
- Protecting user privacy and safety
- Combating harmful content
- Promoting diverse voices
- Building tools for creators to succeed`,
        metadata: {
          description: 'Learn about YouTube\'s mission, history, and commitment to creators and users',
          ogTitle: 'About YouTube',
          ogDescription: 'Learn about YouTube'
        },
        links: [
          'https://www.youtube.com/creators',
          'https://www.youtube.com/premium'
        ]
      },
      {
        url: 'https://www.youtube.com/creators',
        title: 'YouTube for Creators',
        content: `YouTube Creator Academy provides resources, tools, and best practices to help creators build successful channels and grow their audience.

CREATOR TOOLS:
- YouTube Studio for channel management
- Analytics and insights dashboard
- Content ID and copyright tools
- Live streaming capabilities
- Community tab and posts
- Channel memberships
- Super Chat and Super Stickers
- Merchandise shelf

MONETIZATION OPTIONS:
- Ad revenue sharing (YouTube Partner Program)
- Channel memberships
- Super Chat and Super Stickers
- YouTube Premium revenue share
- Brand partnerships
- Merchandise sales

GROWTH RESOURCES:
- Creator Academy courses
- Best practices guides
- Community forums
- Creator support team
- Events and workshops
- Creator awards program`,
        metadata: {
          description: 'Resources and tools for YouTube creators',
          ogTitle: 'YouTube for Creators',
          ogDescription: 'Resources for creators'
        },
        links: [
          'https://www.youtube.com/about',
          'https://www.youtube.com/premium'
        ]
      },
      {
        url: 'https://www.youtube.com/premium',
        title: 'YouTube Premium',
        content: `YouTube Premium is a subscription service that provides an enhanced YouTube experience with ad-free viewing, background play, and offline downloads.

PREMIUM FEATURES:
- Ad-free viewing across all YouTube content
- Background play on mobile devices
- Offline downloads for videos
- YouTube Music Premium included
- Original content and exclusive series
- Early access to new features

PRICING:
- Individual plans available
- Family plans for multiple users
- Student discounts
- Free trial period

BENEFITS:
- Uninterrupted viewing experience
- Support creators through revenue share
- Access to YouTube Music Premium
- Download videos for offline viewing
- Play videos in background while using other apps`,
        metadata: {
          description: 'Ad-free YouTube with background play and offline downloads',
          ogTitle: 'YouTube Premium',
          ogDescription: 'Ad-free YouTube experience'
        },
        links: [
          'https://www.youtube.com/music',
          'https://www.youtube.com/tv'
        ]
      },
      {
        url: 'https://www.youtube.com/music',
        title: 'YouTube Music',
        content: `YouTube Music is a music streaming service that provides access to millions of songs, albums, and music videos.

FEATURES:
- Access to official songs, albums, and music videos
- Personalized playlists and recommendations
- Offline downloads
- Background play
- Ad-free listening (with Premium)
- Smart search that finds songs even with partial lyrics
- Integration with YouTube's video library

CONTENT:
- Official music from major labels
- Independent artist content
- Live performances and concerts
- Remixes and covers
- Music videos and behind-the-scenes content

PLATFORMS:
- Web player
- Mobile apps (iOS and Android)
- Smart speakers and devices
- Car integration`,
        metadata: {
          description: 'Music streaming service with official songs and music videos',
          ogTitle: 'YouTube Music',
          ogDescription: 'Stream music and music videos'
        },
        links: [
          'https://www.youtube.com/premium',
          'https://www.youtube.com'
        ]
      },
      {
        url: 'https://www.youtube.com/tv',
        title: 'YouTube TV',
        content: `YouTube TV is a live TV streaming service that provides access to live and on-demand content from major networks.

FEATURES:
- Live TV from 100+ channels
- Cloud DVR with unlimited storage
- Multiple simultaneous streams
- On-demand content library
- Local and national news
- Sports coverage
- Entertainment and lifestyle channels

CHANNEL LINEUP:
- Major broadcast networks (ABC, CBS, NBC, FOX)
- Cable networks (ESPN, CNN, HGTV, etc.)
- Sports networks
- News channels
- Entertainment and lifestyle
- Kids programming

PRICING:
- Base plan with core channels
- Add-on packages available
- Family sharing options`,
        metadata: {
          description: 'Live TV streaming service with 100+ channels',
          ogTitle: 'YouTube TV',
          ogDescription: 'Stream live TV'
        },
        links: [
          'https://www.youtube.com/premium',
          'https://www.youtube.com'
        ]
      }
    ];

    return {
      mainPage,
      adjacentPages
    };
  }

  /**
   * Check if URL matches a test data pattern
   */
  static hasTestData(url: string): boolean {
    const normalizedUrl = url.toLowerCase().trim();
    return normalizedUrl.includes('airbnb.com') || 
           normalizedUrl.includes('airbnb') ||
           normalizedUrl.includes('youtube.com') ||
           normalizedUrl.includes('youtube');
  }

  /**
   * Get test data for a given URL (if available)
   */
  static getTestData(url: string): ScrapedData | null {
    const normalizedUrl = url.toLowerCase().trim();
    
    if (normalizedUrl.includes('airbnb.com') || normalizedUrl.includes('airbnb')) {
      console.log('📦 Using Airbnb test data (Browser.cash API unavailable)');
      return this.getAirbnbTestData();
    }
    
    if (normalizedUrl.includes('youtube.com') || normalizedUrl.includes('youtube')) {
      console.log('📦 Using YouTube test data (Browser.cash API unavailable)');
      return this.getYouTubeTestData();
    }
    
    return null;
  }
}

