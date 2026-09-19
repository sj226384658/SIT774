/*
 * Movie Night Picker
 *
 * The system:
 * 1. Gets the user's preferences.
 * 2. Searches the OMDb API.
 * 3. Gets movie details from multiple API pages.
 * 4. Filters movies using the user's requirements.
 * 5. Calculates a personalised match percentage.
 * 6. Displays the best matching movies.
 */


/* =========================================
   API CONFIGURATION
   ========================================= */

// Replace this with your own OMDb API key.
const API_KEY = "a02d16c5";

const API_URL =
    "https://www.omdbapi.com/";


/* =========================================
   GET HTML ELEMENTS
   ========================================= */

const movieForm =
    document.getElementById("movieForm");

const movieInput =
    document.getElementById("movieInput");

const genreSelect =
    document.getElementById("genre");

const moodSelect =
    document.getElementById("mood");

const runtimeSelect =
    document.getElementById("runtime");

const ratingSelect =
    document.getElementById("rating");

const message =
    document.getElementById("message");

const loadingSection =
    document.getElementById("loadingSection");

const loadingMessage =
    document.getElementById("loadingMessage");

const resultsSection =
    document.getElementById("resultsSection");

const movieResults =
    document.getElementById("movieResults");

const detailsSection =
    document.getElementById("detailsSection");

const movieDetails =
    document.getElementById("movieDetails");

const backButton =
    document.getElementById("backButton");

const newSearchButton =
    document.getElementById("newSearchButton");


/* =========================================
   FORM SUBMISSION
   ========================================= */

movieForm.addEventListener(
    "submit",
    async function (event) {

        event.preventDefault();


        const searchTerm =
            movieInput.value.trim();


        /* -------------------------------
           Check search length
           ------------------------------- */

        if (searchTerm === "") {

            message.textContent =
                "Please enter a movie or keyword.";

            return;

        }


        if (searchTerm.length < 3) {

            message.textContent =
                "Please enter at least 3 characters.";

            return;

        }


        /* -------------------------------
           Check API key
           ------------------------------- */

        if (API_KEY === "YOUR_API_KEY") {

            message.textContent =
                "Please add your OMDb API key in script.js.";

            return;

        }


        message.textContent = "";

        showLoading();


        try {

            /* -------------------------------
               Search API
               ------------------------------- */

            loadingMessage.textContent =
                "Searching OMDb for movies...";


            const movies =
                await searchMovies(searchTerm);


            /* -------------------------------
               Get movie details
               ------------------------------- */

            loadingMessage.textContent =
                "Loading movie information...";


            const detailedMovies =
                await getMovieDetailsForResults(
                    movies
                );


            /* -------------------------------
               Process preferences
               ------------------------------- */

            loadingMessage.textContent =
                "Matching movies to your preferences...";


            const matchedMovies =
                processMovies(
                    detailedMovies
                );


            /* -------------------------------
               Display results
               ------------------------------- */

            displayMovies(
                matchedMovies
            );


            loadingSection.classList.add(
                "hidden"
            );


            resultsSection.classList.remove(
                "hidden"
            );


            resultsSection.scrollIntoView({
                behavior: "smooth"
            });

        }


        catch (error) {

            loadingSection.classList.add(
                "hidden"
            );


            message.textContent =
                error.message;

        }

    }
);


/* =========================================
   SEARCH OMDb - UP TO 12 MOVIES
   ========================================= */

async function searchMovies(
    searchTerm
) {

    const allMovies = [];


    /* =====================================
       PAGE 1
       ===================================== */

    const firstUrl =
        `${API_URL}?apikey=${API_KEY}` +
        `&s=${encodeURIComponent(searchTerm)}` +
        "&type=movie" +
        "&page=1";


    const firstResponse =
        await fetch(firstUrl);


    if (!firstResponse.ok) {

        throw new Error(
            "Unable to connect to OMDb API."
        );

    }


    const firstData =
        await firstResponse.json();


    if (
        firstData.Response === "False"
    ) {

        /*
         * Convert OMDb errors into
         * user-friendly messages.
         */

        if (
            firstData.Error ===
            "Too many results."
        ) {

            throw new Error(
                "Your search is too broad. Please enter a more specific movie title or keyword."
            );

        }


        throw new Error(
            firstData.Error ||
            "No movies were found."
        );

    }


    /*
     * Add Page 1 movies.
     */

    allMovies.push(
        ...firstData.Search
    );


    /* =====================================
       PAGE 2
       ===================================== */

    /*
     * OMDb normally returns 10 results
     * per page.
     *
     * If more than 10 results exist,
     * request Page 2 as well.
     */

    const totalResults =
        Number(firstData.totalResults);


    if (
        totalResults > 10
    ) {

        const secondUrl =
            `${API_URL}?apikey=${API_KEY}` +
            `&s=${encodeURIComponent(searchTerm)}` +
            "&type=movie" +
            "&page=2";


        const secondResponse =
            await fetch(secondUrl);


        if (
            secondResponse.ok
        ) {

            const secondData =
                await secondResponse.json();


            if (
                secondData.Response === "True"
            ) {

                allMovies.push(
                    ...secondData.Search
                );

            }

        }

    }


    /*
     * Only use the first 12 movies.
     */

    return allMovies.slice(0, 12);

}


/* =========================================
   GET MOVIE DETAILS
   ========================================= */

async function getMovieDetailsForResults(
    movies
) {

    const detailedMovies = [];


    /*
     * Request detailed information
     * for every selected movie.
     */

    for (
        const movie of movies
    ) {

        try {

            const url =
                `${API_URL}?apikey=${API_KEY}` +
                `&i=${encodeURIComponent(movie.imdbID)}` +
                "&plot=short";


            const response =
                await fetch(url);


            if (
                !response.ok
            ) {

                continue;

            }


            const data =
                await response.json();


            if (
                data.Response === "True"
            ) {

                detailedMovies.push(
                    data
                );

            }

        }


        catch (error) {

            console.log(
                "Could not load movie:",
                movie.Title
            );

        }

    }


    return detailedMovies;

}


/* =========================================
   PROCESS AND FILTER MOVIES
   ========================================= */

function processMovies(
    movies
) {

    const selectedGenre =
        genreSelect.value;

    const selectedMood =
        moodSelect.value;

    const maximumRuntime =
        runtimeSelect.value;

    const minimumRating =
        Number(ratingSelect.value);


    const processedMovies = [];


    movies.forEach(
        function (movie) {

            /* -------------------------------
               Get rating and runtime
               ------------------------------- */

            const movieRating =
                parseFloat(
                    movie.imdbRating
                );


            const runtime =
                parseRuntime(
                    movie.Runtime
                );


            /* =================================
               HARD FILTER: RATING
               ================================= */

            /*
             * If a minimum rating is selected,
             * remove movies below that rating.
             */

            if (
                minimumRating > 0
            ) {

                if (
                    isNaN(movieRating)
                ) {

                    return;

                }


                if (
                    movieRating <
                    minimumRating
                ) {

                    return;

                }

            }


            /* =================================
               HARD FILTER: RUNTIME
               ================================= */

            /*
             * Remove movies that are longer
             * than the selected maximum runtime.
             */

            if (
                maximumRuntime !== "Any"
            ) {

                if (
                    runtime === 0
                ) {

                    return;

                }


                if (
                    runtime >
                    Number(maximumRuntime)
                ) {

                    return;

                }

            }


            /* =================================
               HARD FILTER: GENRE
               ================================= */

            /*
             * If the user selected a genre,
             * the movie must contain that genre.
             */

            if (
                selectedGenre !== "Any"
            ) {

                if (
                    !movie.Genre ||
                    !movie.Genre
                        .toLowerCase()
                        .includes(
                            selectedGenre.toLowerCase()
                        )
                ) {

                    return;

                }

            }


            /* =================================
               CALCULATE MATCH SCORE
               ================================= */

            let score = 0;

            let possibleScore = 0;


            /* -------------------------------
               Rating
               ------------------------------- */

            possibleScore += 30;


            if (
                minimumRating === 0
            ) {

                if (
                    !isNaN(movieRating)
                ) {

                    if (
                        movieRating >= 8
                    ) {

                        score += 30;

                    }
                    else if (
                        movieRating >= 7
                    ) {

                        score += 25;

                    }
                    else if (
                        movieRating >= 6
                    ) {

                        score += 20;

                    }
                    else {

                        score += 10;

                    }

                }

            }
            else {

                /*
                 * Movie passed the rating filter.
                 */

                score += 30;

            }


            /* -------------------------------
               Genre
               ------------------------------- */

            possibleScore += 30;


            if (
                selectedGenre === "Any"
            ) {

                score += 30;

            }
            else {

                /*
                 * Movie passed the genre filter.
                 */

                score += 30;

            }


            /* -------------------------------
               Runtime
               ------------------------------- */

            possibleScore += 20;


            if (
                maximumRuntime === "Any"
            ) {

                score += 20;

            }
            else {

                /*
                 * Movie passed the runtime filter.
                 */

                score += 20;

            }


            /* -------------------------------
               Mood
               ------------------------------- */

            possibleScore += 20;


            const moodMatches =
                checkMood(
                    movie,
                    selectedMood
                );


            if (
                moodMatches
            ) {

                score += 20;

            }


            /* -------------------------------
               Match percentage
               ------------------------------- */

            const matchPercentage =
                Math.round(
                    (score / possibleScore) * 100
                );


            processedMovies.push({

                movie: movie,

                score: matchPercentage

            });

        }
    );


    /*
     * Highest matching movies appear first.
     */

    processedMovies.sort(
        function (a, b) {

            return b.score - a.score;

        }
    );


    return processedMovies;

}


/* =========================================
   PARSE RUNTIME
   ========================================= */

function parseRuntime(
    runtimeText
) {

    if (
        !runtimeText ||
        runtimeText === "N/A"
    ) {

        return 0;

    }


    /*
     * Example:
     * "142 min" → 142
     */

    const match =
        runtimeText.match(/\d+/);


    if (!match) {

        return 0;

    }


    return Number(
        match[0]
    );

}


/* =========================================
   MOOD MATCHING
   ========================================= */

function checkMood(
    movie,
    mood
) {

    if (
        mood === "Any"
    ) {

        return true;

    }


    const genre =
        movie.Genre
            ? movie.Genre.toLowerCase()
            : "";


    const plot =
        movie.Plot
            ? movie.Plot.toLowerCase()
            : "";


    switch (mood) {

        case "Fun":

            return (
                genre.includes("comedy") ||
                genre.includes("animation") ||
                genre.includes("family") ||
                plot.includes("funny")
            );


        case "Exciting":

            return (
                genre.includes("action") ||
                genre.includes("adventure") ||
                genre.includes("thriller")
            );


        case "Relaxing":

            return (
                genre.includes("comedy") ||
                genre.includes("romance") ||
                genre.includes("family")
            );


        case "Scary":

            return (
                genre.includes("horror") ||
                genre.includes("thriller")
            );


        case "Romantic":

            return (
                genre.includes("romance") ||
                genre.includes("romantic")
            );


        case "Serious":

            return (
                genre.includes("drama") ||
                genre.includes("crime") ||
                genre.includes("history")
            );


        default:

            return false;

    }

}


/* =========================================
   DISPLAY MOVIES
   ========================================= */

function displayMovies(
    matchedMovies
) {

    movieResults.innerHTML = "";


    /* -------------------------------
       No results
       ------------------------------- */

    if (
        matchedMovies.length === 0
    ) {

        movieResults.innerHTML = `

            <div class="message">

                No movies matched your
                selected preferences.

                <br><br>

                Try changing your genre,
                rating or runtime.

            </div>

        `;

        return;

    }


    /* -------------------------------
       Display movie cards
       ------------------------------- */

    matchedMovies.forEach(
        function (item) {

            const movie =
                item.movie;


            const card =
                document.createElement(
                    "article"
                );


            card.className =
                "movie-card";


            /* ---------------------------
               Poster
               --------------------------- */

            const poster =
                document.createElement(
                    "img"
                );


            poster.className =
                "movie-poster";


            poster.alt =
                `${movie.Title} poster`;


            if (
                movie.Poster &&
                movie.Poster !== "N/A"
            ) {

                poster.src =
                    movie.Poster;

            }
            else {

                poster.alt =
                    "Movie poster unavailable";

            }


            /* ---------------------------
               Movie information
               --------------------------- */

            const info =
                document.createElement(
                    "div"
                );


            info.className =
                "movie-info";


            info.innerHTML = `

                <h3>
                    ${movie.Title}
                </h3>

                <p>
                    ${movie.Year}
                </p>

                <p>
                    ⭐ ${movie.imdbRating}
                </p>

                <p>
                    ${movie.Runtime}
                </p>

                <span class="match-score">
                    ${item.score}% Match
                </span>

                <br><br>

                <button
                    class="secondary-button"
                    type="button">

                    View Details

                </button>

            `;


            /* ---------------------------
               Details button
               --------------------------- */

            const detailsButton =
                info.querySelector(
                    "button"
                );


            detailsButton.addEventListener(
                "click",
                function () {

                    loadMovieDetails(
                        movie.imdbID
                    );

                }
            );


            card.appendChild(
                poster
            );


            card.appendChild(
                info
            );


            movieResults.appendChild(
                card
            );

        }
    );

}


/* =========================================
   LOAD MOVIE DETAILS
   ========================================= */

async function loadMovieDetails(
    movieID
) {

    resultsSection.classList.add(
        "hidden"
    );


    detailsSection.classList.remove(
        "hidden"
    );


    movieDetails.innerHTML = `

        <p>
            Loading movie details...
        </p>

    `;


    try {

        const url =
            `${API_URL}?apikey=${API_KEY}` +
            `&i=${encodeURIComponent(movieID)}` +
            "&plot=full";


        const response =
            await fetch(url);


        if (
            !response.ok
        ) {

            throw new Error(
                "Unable to load movie details."
            );

        }


        const movie =
            await response.json();


        if (
            movie.Response === "False"
        ) {

            throw new Error(
                movie.Error ||
                "Movie details unavailable."
            );

        }


        displayMovieDetails(
            movie
        );

    }


    catch (error) {

        movieDetails.innerHTML = `

            <p class="message">
                ${error.message}
            </p>

        `;

    }

}


/* =========================================
   DISPLAY MOVIE DETAILS
   ========================================= */

function displayMovieDetails(
    movie
) {

    const poster =
        movie.Poster !== "N/A"
            ? movie.Poster
            : "";


    movieDetails.innerHTML = `

        ${
            poster
            ? `
                <img
                    class="details-poster"
                    src="${poster}"
                    alt="${movie.Title} poster">
            `
            : ""
        }


        <div class="details-content">

            <p class="eyebrow">
                MOVIE DETAILS
            </p>


            <h2>
                ${movie.Title}
            </h2>


            <div class="detail-item">

                <span class="detail-label">
                    Year:
                </span>

                ${movie.Year}

            </div>


            <div class="detail-item">

                <span class="detail-label">
                    Genre:
                </span>

                ${movie.Genre}

            </div>


            <div class="detail-item">

                <span class="detail-label">
                    Runtime:
                </span>

                ${movie.Runtime}

            </div>


            <div class="detail-item">

                <span class="detail-label">
                    IMDb Rating:
                </span>

                ⭐ ${movie.imdbRating}

            </div>


            <div class="detail-item">

                <span class="detail-label">
                    Director:
                </span>

                ${movie.Director}

            </div>


            <div class="detail-item">

                <span class="detail-label">
                    Actors:
                </span>

                ${movie.Actors}

            </div>


            <div class="plot">

                <h3>
                    Plot
                </h3>

                <p>
                    ${movie.Plot}
                </p>

            </div>

        </div>

    `;


    detailsSection.scrollIntoView({
        behavior: "smooth"
    });

}


/* =========================================
   BACK TO RESULTS
   ========================================= */

backButton.addEventListener(
    "click",
    function () {

        detailsSection.classList.add(
            "hidden"
        );


        resultsSection.classList.remove(
            "hidden"
        );


        resultsSection.scrollIntoView({
            behavior: "smooth"
        });

    }
);


/* =========================================
   NEW SEARCH
   ========================================= */

newSearchButton.addEventListener(
    "click",
    function () {

        resultsSection.classList.add(
            "hidden"
        );


        detailsSection.classList.add(
            "hidden"
        );


        movieForm.reset();


        message.textContent = "";


        document
            .getElementById("picker")
            .scrollIntoView({
                behavior: "smooth"
            });

    }
);


/* =========================================
   SHOW LOADING
   ========================================= */

function showLoading() {

    loadingSection.classList.remove(
        "hidden"
    );


    resultsSection.classList.add(
        "hidden"
    );


    detailsSection.classList.add(
        "hidden"
    );

}