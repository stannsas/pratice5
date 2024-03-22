const express = require('express')
const app = express()
const path = require('path')

const {open} = require('sqlite')
const sqlite3 = require('sqlite3')

app.use(express.json())

const dbpath = path.join(__dirname, 'moviesData.db')
let db = null

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbpath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () => {
      console.log('Server is running at http://localhost:3000/')
    })
  } catch (e) {
    console.log(`DB error: ${e.message}`)
    process.exit(1)
  }
}

initializeDBAndServer()

const convertDbToMovieResponse = dbObject => {
  return {
    MovieId: dbObject.movie_id,
    MovieName: dbObject.movie_name,
    DirectorId: dbObject.director_id,
    LeadActor: dbObject.lead_actor,
  }
}

const convertDbToDirectorResponse = dbObject => {
  return {
    DirectorId: dbObject.director_id,
    DirectorName: dbObject.director_name,
  }
}

// API 1
app.get('/movies/', async (request, response) => {
  try {
    const getMoviesQuery = 'SELECT movie_name FROM movie'
    const allMovies = await db.all(getMoviesQuery)
    const movieNames = allMovies.map((movies)=>convertDbToMovieResponse(movies))
    response.json(movieNames)
  } catch (error) {
    console.log(`Error: ${error.message}`)
    response.status(500).send('Internal Server Error')
  }
})

// API 2: 
app.get('/movies/:movieId/', async (request, response) => {
  try {
    const movieId = request.params.movieId
    const getMovieQuery = 'SELECT * FROM movie WHERE movie_id = ?'
    const movie = await db.get(getMovieQuery, [movieId])
    if (movie) {
      response.json(movie)
    } else {
      response.status(404).send('Movie not found')
    }
  } catch (error) {
    console.log(`Error: ${error.message}`)
    response.status(500).send('Internal Server Error')
  }
})
// API 3: 
app.post('/movies/', async (request, response) => {
  const {movieName, directorId, leadActor} = request.body
  const addMovieQuery = `INSERT INTO movie (movie_name, director_id, lead_actor)
                           VALUES (?, ?, ?)`
  await db.run(addMovieQuery, [movieName, directorId, leadActor])
  response.send('Movie Successfully Added')
})

// API 4
app.put('/movies/:movieId/', async (request, response) => {
  const movieId = request.params.movieId
  const {movieName, directorId, leadActor} = request.body
  const updateMovieQuery = `UPDATE movie
                              SET movie_name = ?, director_id = ?, lead_actor = ?
                              WHERE movie_id = ?`
  await db.run(updateMovieQuery, [movieName, directorId, leadActor, movieId])
  response.send('Movie Details Updated')
})

// API 5:
app.delete('/movies/:movieId/', async (request, response) => {
  const movieId = request.params.movieId
  const deleteMovieQuery = 'DELETE FROM movie WHERE movie_id = ?'
  await db.run(deleteMovieQuery, [movieId])
  response.send('Movie Removed')
})

// API 6: 
app.get('/directors/', async (request, response) => {
  const getDirectorsQuery = 'SELECT * FROM director'
  const allDirectors = await db.all(getDirectorsQuery)
  response.send(
    allDirectors.map(director => convertDbToDirectorResponse(director)),
  )
})


app.get('/directors/:directorId/movies/', async (request, response) => {
  const directorId = request.params.directorId
  const getDirectorMoviesQuery =
    'SELECT movie_name FROM movie WHERE director_id = ?'
  const directorMovies = await db.all(getDirectorMoviesQuery, [directorId])
  response.send(directorMovies.map(movie => movie.movie_name))
})

module.exports = app
