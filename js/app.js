// API Module
const APIController = (function() {

    // spotify API
    const clientId = 'd204445db1884dbf8da85b731b931ef6';
    const clientSecret = '9fd64ab42a2449f7af0422e22ffc5193';
    const redirectUrl = 'http://localhost:3000/';
    //const redirectUrl = 'https://i436839.hera.fhict.nl/';
    const auth = 'https://accounts.spotify.com/authorize?';

    // private method get token
    const _getToken = async (code) => {
        const result = await fetch('https://accounts.spotify.com/api/token', {
            method: 'POST',
            headers: {
                'Content-type' : 'application/x-www-form-urlencoded',
                'Authorization' : 'Basic ' + btoa(clientId + ':' + clientSecret)
            },
            body: `grant_type=authorization_code&code=${code}&redirect_uri=${encodeURI(redirectUrl)}&client_id=${clientId}&client_secret=${clientSecret}`
        });

        const data = await result.json();
        localStorage.setItem('refresh_token', data.refresh_token);
        localStorage.setItem('access_token', data.access_token);
        return data.access_token;
    };

    // private method refresh access_token
    const _refreshToken = async (refresh_token) => {
        const result = await fetch('https://accounts.spotify.com/api/token', {
            method: 'POST',
            headers: {
                'Content-type' : 'application/x-www-form-urlencoded',
                'Authorization' : 'Basic ' + btoa(clientId + ':' + clientSecret)
            },
            body: `grant_type=refresh_token&refresh_token=${refresh_token}&client_id=${clientId}`
        });

        const data = await result.json();
        localStorage.setItem('access_token', data.access_token);
        return data.access_token;
    }

    // get code
    const _getCode = async () => {
        let code = null;
        const queryString = window.location.search;

        if(queryString.length > 0){
            const urlParams = new URLSearchParams(queryString);
            code = urlParams.get('code');
        }

        window.history.pushState('','', redirectUrl);
        return code;
    }

    // private method auth user
    const _authUser = async () => {
        // url
        let url = auth;
        url += 'client_id=' + clientId;
        url += '&response_type=code';
        url += '&redirect_uri=' + encodeURI(redirectUrl);
        url += '&show_dialog=true';
        url += '&scope=ugc-image-upload user-read-playback-state user-modify-playback-state user-read-currently-playing user-read-private user-read-email user-follow-read streaming app-remote-control user-read-playback-position user-top-read user-read-recently-played';
        
        // redirect: show spotify auth screen
        window.location.href = url; 
    }

    // private method user
    const _getProfile = async (token) => {
        const result = await fetch(`https://api.spotify.com/v1/me`, {
            method: 'GET',
            headers: { 'Authorization' : 'Bearer ' + token }
        });

        if(result.status == 403){
            _refreshToken(localStorage.getItem('refresh_token'));
            _getProfile(token);
        }

        const data = await result.json();
        return data;
    }

    // private method get top tracks/artists
    const _getTopTrackOrArtist = async (token, type) => {
        const limit = 56;
        const result = await fetch(`https://api.spotify.com/v1/me/top/${type}s?limit=${limit}`, {
            method: 'GET',
            headers: { 'Authorization' : 'Bearer ' + token }
        });

        if(result.status == 403){
            _refreshToken(localStorage.getItem('refresh_token'));
            _getTopTrackOrArtist(token, type);
        }

        const data = await result.json();
        return data.items;
    };

    const _getArtistsOfTrack = async (token, ids) => {
        const result = await fetch(`https://api.spotify.com/v1/artists?ids=${ids}`, {
            method: 'GET',
            headers: { 'Authorization' : 'Bearer ' + token }
        });

        if(result.status == 403){
            _refreshToken(localStorage.getItem('refresh_token'));
            _getArtistsOfTrack(token, ids);
        }

        const data = await result.json();
        return data;
    }

    // private method search track
    const _search = async (token, searchVal, type) => {
        const limit = 25;
        const result = await fetch(`https://api.spotify.com/v1/search?type=${type}&q=${searchVal}&limit=${limit}`, {
            method: 'GET',
            headers: { 'Authorization' : 'Bearer ' + token }
        });

        if(result.status == 403){
            _refreshToken(localStorage.getItem('refresh_token'));
            _search(token, searchVal, type);
        }

        const data = await result.json();
        return data[type+'s'].items;
    };

    // private method get track
    const _getDetail = async (token, trackEndPoint) => {
        const result = await fetch(`${trackEndPoint}`, {
            method: 'GET',
            headers: { 'Authorization' : 'Bearer ' + token }
        });

        if(result.status == 403){
            _refreshToken(localStorage.getItem('refresh_token'));
            _getDetail(token, trackEndPoint);
        }

        const data = await result.json();
        return data;
    };

    const _getUserFollowedArtist = async (token) => {
        // get user followed artist 
        const limit = 50;
        const result = await fetch(`https://api.spotify.com/v1/me/following?type=artist&limit=${limit}`, {
            method: 'GET',
            headers: { 'Authorization' : 'Bearer ' + token }
        });

        if(result.status == 403){
            _refreshToken(localStorage.getItem('refresh_token'));
            _getDetail(token, trackEndPoint);
        }

        const data = await result.json();
        return data.artists.items;
    }

    const _getNewReleasesArtist = async (token, artistId) => {
        // get artists latests releases 
        const result = await fetch(`https://api.spotify.com/v1/artists/${artistId}/albums?include_groups=album,single,appears_on`, {
            method: 'GET',
            headers: { 'Authorization' : 'Bearer ' + token }
        });

        if(result.status == 403){
            _refreshToken(localStorage.getItem('refresh_token'));
            _getDetail(token, trackEndPoint);
        }

        const data = await result.json();
        return data.items;
    }

    const _getDateDifference = async (date1, date2) => {
        const diffInMs = Math.abs(date2 - date1);
        return diffInMs / (1000 * 60 * 60 * 24);
    }

    // private method get new releases
    const _getNewReleases = async (token) => {
        // get user followed artist 
        const followedArtists = await _getUserFollowedArtist(token);
        
        const latestReleases = [];
        await Promise.all(followedArtists.map(async (fa) => {
            latestReleases.push( await _getNewReleasesArtist(token, fa.id) );
        }));

        // filter array
        var filteredReleases = [];
        var today = new Date();
        await Promise.all(latestReleases.map(async (lr) => {
            await Promise.all(lr.map(async (r) => {
                const releaseDate = new Date(r.release_date.replace(/-/g, '/'))
                const dateDiff = await _getDateDifference(releaseDate, today);
                if (dateDiff < 21 && r.album_type != 'compilation'){
                    r.date_diff = dateDiff;
                    filteredReleases.push(r)
                }
            }))
        }))

        // sort array on date
        const sortedReleases = filteredReleases.sort((a, b) => new Date(b.release_date) - new Date(a.release_date));

        // filter dups
        const removedDups = sortedReleases.reduce((acc, current) => {
            const x = acc.find(item => item.name === current.name);
            if (!x) {
                return acc.concat([current]);
            } else {
                return acc;
            }
        }, []);

        console.log(removedDups);


        return removedDups;
    };

    return {
        getToken(code) {
            return _getToken(code);
        },
        getCode() {
            return _getCode();
        },
        refreshToken(refreshToken){
            return _refreshToken(refreshToken)
        },
        authUser() {
            return _authUser();
        },
        getProfile(token) {
            return _getProfile(token);
        },
        getTopTrackOrArtist(token, type) {
            return _getTopTrackOrArtist(token, type);
        },
        search(token, searchVal, type) {
            return _search(token, searchVal, type);
        },
        getDetail(token, trackEndPoint) {
            return _getDetail(token, trackEndPoint);
        },
        getArtistsOfTrack(token, ids) {
            return _getArtistsOfTrack(token, ids);
        },
        getNewReleases(token) {
            return _getNewReleases(token);
        }
    }

})();

// UI Module
const UIController = (function(){

    // object to hold html selectors
    const DOMElements = {
        searchBar: '#search-song',
        resultContainer: '#resultContainer',
        filterActive: '.filter-type--active',
        profileContainer: '#profile',
        topArtistContainer: '#top-artist',
        topTrackContainer: '#top-track',
        homePage: '#home',
        getDetail: '.get-detail',
        detailContainer: '#detailContainer',
        greetingContainer: '#greeting',
        newReleases: '#newReleases'
    }

    // public method
    return {
        inputField(){
            return {
                search: document.querySelector(DOMElements.searchBar),
                filterActive: document.querySelector(DOMElements.filterActive)
            }
        },

        containerEl(){
            return {
                getDetail: DOMElements.getDetail,
                newReleases: DOMElements.newReleases
            }
        },

        createSearchResult(img, title, artist, type, href, htmlContainer){
            const container = document.querySelector(DOMElements[htmlContainer]);
            const html = 
            `  
                <div onclick="APPController.showDetail(this);" data-type="${type}" data-result-href="${href}" class="result get-detail">
                    <img class="result-cover result-cover--${type}" src="${img}" alt="cover"/>
                    <div class="result-info">
                        <span class="result-title">${title}</span>
                        <span class="result-artist">${artist}</span>
                    </div>
                </div>
            `;
            container.insertAdjacentHTML('beforeend', html);
        },

        createReleases(img, title, artist, type, href, date, daysago, htmlContainer){
            const container = document.querySelector(DOMElements[htmlContainer]);
            const html = 
            `  
                <div onclick="APPController.showDetail(this);" data-type="${type}" data-result-href="${href}" class="result get-detail">
                    <img class="result-cover result-cover--${type}" src="${img}" alt="cover"/>
                    <div class="result-info">
                        <span class="result-date">${Math.floor(daysago)} days ago</span>
                        <span class="result-title">${title}</span>
                        <span class="result-artist">${artist}</span>
                    </div>
                </div>
            `;
            container.insertAdjacentHTML('beforeend', html);
        },

        getFilterType() {
            return document.querySelector(DOMElements.filterActive).id;
        },

        resetSearch() {
            document.querySelector(DOMElements.resultContainer).innerHTML = '';
        },

        generateGreetings(){
            const currentHour = new Date().getHours();
          
            if (currentHour >= 3 && currentHour < 12){
                return "Good morning";
            } else if (currentHour >= 12 && currentHour < 15){
                return "Good afternoon";
            }   else if (currentHour >= 15 && currentHour < 20){
                return "Good evening";
            } else if (currentHour >= 20 && currentHour < 3){
                return "Good night";
            } else {
                return "Hello"
            }
        },

        showGreeting() {
            const container = document.querySelector(DOMElements.greetingContainer);
            const html =
            `
                <div class="greeting">
                    <h1>${this.generateGreetings()}</span></h1>
                </div>
            `;
            container.insertAdjacentHTML('beforeend', html);
        },

        createTopTracksOrArtists(image, subText, name, href, type, count) { 
            const container = document.querySelector(DOMElements[`top${type.charAt(0).toUpperCase() + type.slice(1)}Container`]);

            const html =
            `
                <div onclick="APPController.showDetail(this);" data-result-href="${href}" data-type="${type}" class="top get-detail top--${type}">
                    <img class="top-cover top-cover--${type}" src="${image}" alt="cover"/>
                    <div class="top-info top-info--${type}">
                        <span class="top-name">${count + '.' + ' ' + name}</span>
                        <span class="top-subtext">${subText}</span>
                    </div>
                </div>
            `;

            container.insertAdjacentHTML('beforeend', html);
        },

        createNewReleases(name, date, image) {

        },

        showHomeScreen() {
            document.querySelector(DOMElements.homePage).classList.add('page-section--active');
        },

        showDetailSection(image, name, releaseDate, spotifyURL) {
            const container = document.querySelector(DOMElements.detailContainer);
            container.innerHTML = '';

            const html = 
            `
                <img onclick="hideDetail()" class="icon detail--back-button" src="assets/img/chevron-left.svg" alt="back-button">
                <div class="detail-banner">
                    <img class="banner-image" src="${image}" alt="banner"/>
                </div>
                <div id="detail-content" class="detail-content"> 
                    <div class="detail-content--title">
                        <div class="detail-content--title-left">
                            <div id="outer" class="ellipsis-slide">
                                <div>
                                    <div id="loop" class="ellipsis-slide--loop"><div id="content"><h1>${name}</h1></div></div>
                                </div>
                            </div>
                            <span class="subtext">${releaseDate}</span>
                        </div>
                        <a href="${spotifyURL}" class="detail-content--title-right">
                            <img class="icon spotify" src="assets/img/spotify.svg" alt="spotify-logo">
                            <span>Open Spotify</span>
                        </a>
                    </div>
                </div>
            `;

            container.insertAdjacentHTML('beforeend', html);
            container.classList.add('detail--show');
            initEllipsisAnimation();
        },

        showTrackInfo(popularity, duration, artists){
            const container = document.querySelector('#detail-content');

            let html = 
            `
                <div class="track-info-wrapper">
                    <h3>Info</h3>
                    <div class="track-info">
                        <div class="track-info--length">
                            <span class="text">${duration}</span>
                            <span class="subtext">Track Length<span>
                        </div>
                        <div class="track-info--popularity">
                            <span class="text">${popularity}</span>
                            <span class="subtext">0-10 Popularity<span>
                        </div>
                    </div>
                    <h3>Artists</h3>
                    <div class="track-artists main-carousel">`;
                        artists.artists.forEach(function(artist){
                            html += `
                                <div class="track-artists--artist carousel-cell">
                                    <img class="artist-cover" src="${artist.images[0].url}" alt="artist image"/>
                                    <span>${artist.name}</span>
                                </div>
                            `;
                        });
            html += `</div>
                </div>`;

    


            container.insertAdjacentHTML('beforeend', html);
            initFlickity();
        },

        showAlbumInfo(label, release, totalTracks, tracks, artist) {
            const container = document.querySelector('#detail-content');

            let html = 
            `
                <div class="album-info">
                    <h3>${artist}</h3>
                    <p class="sub-info" >Album &bull; ${release.substring(0,4)} &bull; ${totalTracks} tracks</p>
                </div>
                <div class="album-tracks">
            `;

            tracks.forEach(function(track){
                html += 
                    `<div class="track" onclick="APPController.showDetail(this);" data-type="track" data-result-href="${track.href}">
                        <span class="track-name">${track.name}</span>
                        <div class="track-artists">`;

                            track.artists.forEach(function(a, idx, array){
                                if (idx === array.length - 1){
                                    html += `<span class="artist">${a.name}</span>`;
                                } else{
                                    html += `<span class="artist">${a.name}, </span>`;
                                }
                                
                            })

                html += `</div>
                    </div>`;
            })

            html +=
            `
                </div> 
                <div class="album-extra">
                    <span>&copy; &#8471; ${release.substring(0,4)} ${label}</span>
                </div>
            `

            container.insertAdjacentHTML('beforeend', html);
        },

        showNewReleases() {

        },

    }

})();

// App Module
const APPController = (function(UICtrl, APICtrl) {

    // get input field object ref
    const DOMInputs = UICtrl.inputField();

    // page load
    const startApp = async () => {
        if( window.location.search.length <= 0 ){
            // opt user to login with spotify account
            await APICtrl.authUser();
        } else {
            const code = await APICtrl.getCode();
            // get token
            const token = await APICtrl.getToken(code);
            // get top track
            const topTracks = await APICtrl.getTopTrackOrArtist(token, 'track');
            // get top artist
            const topArtists = await APICtrl.getTopTrackOrArtist(token, 'artist');
            // get new releases
            const newReleases = await APICtrl.getNewReleases(token);
    
            // show greeting
            UICtrl.showGreeting();
    
            // show top tracks & artists
            let count = 0;
            topTracks.forEach(element => UICtrl.createTopTracksOrArtists(element.album.images[0].url, element.artists[0].name, element.name, element.href, 'track', count += 1));
            count = 0
            topArtists.forEach(element => UICtrl.createTopTracksOrArtists(element.images[0].url, new Intl.NumberFormat().format(element.followers.total).replace(/,/g, '.') + ' followers', element.name, element.href, 'artist', count += 1));
    
            // show homescreen
            UICtrl.showHomeScreen();

            // show new releases 
            newReleases.forEach(element => UICtrl.createReleases(element.images[0].url, element.name, element.artists[0].name, element.type, element.href, element.release_date, element.date_diff, 'newReleases'));
        }
    }

    // search event
    DOMInputs.search.addEventListener('keyup', async (e) => {
        // reset searched tracks
        UICtrl.resetSearch();
        // filter type
        const filter = UICtrl.getFilterType();
        // get token
        const token = localStorage.getItem('access_token');
        // search
        const searchData = await APICtrl.search(token, e.target.value, filter);

        switch(filter) {
            case 'track':
                searchData.forEach(element => UICtrl.createSearchResult(element.album.images[0].url, element.name, element.artists[0].name, filter, element.href, 'resultContainer'));
            break;
            case 'artist':
                searchData.forEach(element => UICtrl.createSearchResult(element.images[0].url, element.name, '', filter, element.href, 'resultContainer'));
            break;
            case 'album':
                searchData.forEach(element => UICtrl.createSearchResult(element.images[0].url, element.name, element['release_date'].substring(0,4), filter, element.href, 'resultContainer'));
            break;
        }
    });

    const showDetail = async (e) => {
        // get detail 
        const item = await APICtrl.getDetail(localStorage.getItem('access_token'), e.dataset.resultHref);
        // get type
        const type = e.dataset.type;

        // show detail page
        switch(type) {
            case 'track':
                let ids = '';
                item.artists.forEach(function(element){ ids += element.id + ',' });
                ids = ids.slice(0,-1)
                const artists = await APICtrl.getArtistsOfTrack(localStorage.getItem('access_token'), ids);
                UICtrl.showDetailSection(item.album.images[0].url, item.name, item.album.release_date, item.uri);
                UICtrl.showTrackInfo((item.popularity / 10), millisToMinutesAndSeconds(item.duration_ms), artists);
            break;
            case 'artist':
                UICtrl.showDetailSection(item.images[0].url, item.name);
            break;
            case 'album':
                UICtrl.showDetailSection(item.images[0].url, item.name, item.label, item.uri);
                UICtrl.showAlbumInfo(item.label, item.release_date, item.total_tracks, item.tracks.items, item.artists[0].name);
            break;
        }
    }
    
    const millisToMinutesAndSeconds = function(millis){
        var minutes = Math.floor(millis / 60000);
        var seconds = ((millis % 60000) / 1000).toFixed(0);
        return minutes + ":" + (seconds < 10 ? '0' : '') + seconds;
    }

    return {
        init() {
            console.log('App is starting');
            startApp();
        },

        showDetail(e){
            showDetail(e)
        },

        showNewReleases(e){
            showNewReleases(e)
        }
    }
    
})(UIController, APIController);

// load
APPController.init();

function hideDetail(){
    const detailContainer = document.getElementById('detailContainer')
    detailContainer.classList.remove("detail--show");
    detailContainer.classList.add("detail--hide");
}

function initFlickity(){
    var elem = document.querySelector('.main-carousel');
    var flkty = new Flickity( elem, {
        // options
        cellAlign: 'left',
        freeScroll: true,
        prevNextButtons: false,
        pageDots: false,
        selectedAttraction: 0.01,
        friction: 0.15,
        contain: true
    });
}

function initEllipsisAnimation(){
    let outer = document.querySelector("#outer");
    let content = outer.querySelector('#content');

    if(content.offsetWidth < outer.offsetWidth){
        document.querySelector('.ellipsis-slide--loop').classList.remove('ellipsis-slide--loop');
    } else {
        repeatContent(content, outer.offsetWidth);
        let el = outer.querySelector('#loop');
        el.innerHTML = el.innerHTML + el.innerHTML;
    }
}

function repeatContent(el, till) {
    let html = el.innerHTML;
    let counter = 0; // prevents infinite loop

    while (el.offsetWidth < till && counter < 100) {
        el.innerHTML += html;
        counter += 1;
    }
} 