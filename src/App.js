import { useRef, useEffect, useState } from 'react'
import * as tt from '@tomtom-international/web-sdk-maps'
import * as ttapi from '@tomtom-international/web-sdk-services'
import './App.css'
import '@tomtom-international/web-sdk-maps/dist/maps.css'

const App = () => {
  const mapElement = useRef()
  const [map, setMap] = useState({})
  const [longitude, setLongitude] = useState(-0.099872)
  const [latitude, setLatitude] = useState(51.546443)

  const convertToPoints = (lngLat) => {
    return {
      point: {
        latitude: lngLat.lat,
        longitude: lngLat.lng
      }
    }
  }

  const drawRoute = (geoJson, map) => {
    if (map.getLayer('route')) {
      map.removeLayer('route')
      map.removeSource('route')
    }
    map.addLayer({
      id: 'route',
      type: 'line',
      source: {
        type: 'geojson',
        data: geoJson
      },
      paint: {
        'line-color': 'yellow',
        'line-width': 5
      }
    })
  }

  const addDeliveryMarker = (lngLat, map) => {
    const element = document.createElement("div")
    element.className = "delivery-marker"
    new tt.Marker({
      element: element,
    })
    .setLngLat(lngLat)
    .addTo(map)
  }

  useEffect(() => {
    const origin = {
      lng: longitude,
      lat: latitude,
    }
    const destinations = []

    let map = tt.map({
      key: "kj60XoOrdq7ogNDf1JYT31JXGCaWkfYZ",
      container: mapElement.current,
      stylesVisibility: {
        trafficIncidents: true,
        trafficFlow: true,
      },
      center: [longitude, latitude],
      zoom: 14,
      
    })

    setMap(map)

    const addMarker = () => {
      const popupOffset = {
        bottom: [0, -25]
      }

      const popup = new tt.Popup({ offset: popupOffset }).setHTML('You Are Here!')
      const element = document.createElement("div")
      element.className = "marker"

      const marker = new tt.Marker({
        draggable: true,
        element: element,
      })
        .setLngLat([longitude, latitude])
        .addTo(map)

      marker.on('dragend', () => {
        const lngLat = marker.getLngLat()
        setLongitude(lngLat.lng)
        setLatitude(lngLat.lat)
      })

      marker.setPopup(popup).togglePopup()

    }
    addMarker()

    const sortDestinations = (locations) => {
      const pointsForDestinations = locations.map((destination) => {
        return convertToPoints(destination) 
      })
      const callParameters = {
        key: "kj60XoOrdq7ogNDf1JYT31JXGCaWkfYZ",
        destinations: pointsForDestinations,
        origins: [convertToPoints(origin)],
      }

      return new Promise((resolve, reject) => {
        ttapi.services
          .matrixRouting(callParameters)
          .then((matrixAPIResults) => {
           const results = matrixAPIResults.matrix[0]
           const resultsArray = results.map((result, index) => {
             return {
               location: locations[index],
               drivingtime: result.response.routeSummary.travelTimeInSeconds,
             }
           })
           resultsArray.sort((a, b) => {
             return a.drivingtime - b.drivingtime
           })
          const sortedLocations = resultsArray.map((result) => {
             return result.location
           })
           resolve(sortedLocations)
        })
      })
    }

    const recalculateRoutes = () => {
      sortDestinations(destinations).then((sorted) => {
        sorted.unshift(origin)
      

      ttapi.services
        .calculateRoute({
          key: "kj60XoOrdq7ogNDf1JYT31JXGCaWkfYZ",
          locations: sorted,
        })
      .then((routeData) => {
        const geoJson = routeData.toGeoJson()
        drawRoute(geoJson, map)
      })
    })
  }

    map.on('click', (e) => {
    destinations.push(e.lngLat)
    addDeliveryMarker(e.lngLat, map)
    recalculateRoutes()
  })

    return () => map.remove()
  }, [longitude, latitude])


  return (
    <>
      {map && (
      <div className="app">
        <div ref={mapElement} className="map" />
        <div className="search-bar">
          <h1 className="title">Delivery Routing App 🚘</h1>
          <input  
          type="text" 
          id="longitude" 
          className="longitude"
          placeholder="Type in Longitude"
          onChange={(e) => {setLongitude(e.target.value)}}
          />
          <input 
          type="text" 
          id="latitude" 
          className="latitude"
          placeholder="Type in Latitude"
          onChange={(e) => {setLatitude(e.target.value)}}
          /> 
          <p class="info-p">Scroll down for app info ⬇️</p>
          <p class="delivery-p">
            For this Distance Matrix <b class="delivery-white">Delivery Routing App</b> I have used the <b class="delivery-white">TomTom Map SDK</b> for Web to showcase the <b class="delivery-white">best route</b> for <b class="delivery-white">delivery drivers</b> to take when dropping off <b class="delivery-white">multiple deliveries,</b> based on time efficiency.  
          <p>This <b class="delivery-white">Delivery App</b> also takes the following into account:</p>
              <ol>
                <li>
                  The <b class="delivery-white">volume</b> of <b class="delivery-white">traffic</b> on the roads.
                </li>
                <li>
                  The <b class="delivery-white">number</b> of <b class="delivery-white">traffic incidents</b> on the roads.
                </li>
              </ol>
              The <b class="delivery-white">final route</b> is calculated using an incredible <b class="delivery-white"><a href="https://www.tomtom.com/products/routing/" target="_blank">Routing API</a></b> provided by <b class="delivery-white">TomTom.</b>
          </p>
        </div>
      </div>
      )}
    </>
  )
}

export default App;
