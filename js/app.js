// API Module
const APIController = (function() {

    // spotify API
    const clientId = 'd204445db1884dbf8da85b731b931ef6';
    const clientSecret = '9fd64ab42a2449f7af0422e22ffc5193';
    const redirectUrl = 'http://localhost:3000/';
    // const redirectUrl = 'https://i436839.hera.fhict.nl/';
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
        greetingContainer: '#greeting'
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
                getDetail: DOMElements.getDetail
            }
        },

        createSearchResult(img, title, artist, type, href){
            const container = document.querySelector(DOMElements.resultContainer);
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

        showHomeScreen() {
            document.querySelector(DOMElements.homePage).classList.add('page-section--active');
        },

        showDetailSection(image, name) {
            const container = document.querySelector(DOMElements.detailContainer);
            container.innerHTML = '';

            const html = 
            `
                <div class="detail-banner">
                    <img class="banner-image" src="${image}" alt="banner"/>
                </div>
                <div id="detail-content" class="detail-content">
                    <h1>${name}</h1>
                </div>
            `;

            container.insertAdjacentHTML('beforeend', html);
            container.classList.add('detail--show');
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
                    `<div class="track">
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
        }
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
    
            // show greeting
            UICtrl.showGreeting();
    
            // show top tracks & artists
            let count = 0;
            topTracks.forEach(element => UICtrl.createTopTracksOrArtists(element.album.images[0].url, element.artists[0].name, element.name, element.href, 'track', count += 1));
            count = 0
            topArtists.forEach(element => UICtrl.createTopTracksOrArtists(element.images[0].url, new Intl.NumberFormat().format(element.followers.total).replace(/,/g, '.') + ' followers', element.name, element.href, 'artist', count += 1));
    
            // show homescreen
            UICtrl.showHomeScreen();
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
                searchData.forEach(element => UICtrl.createSearchResult(element.album.images[0].url, element.name, element.artists[0].name, filter, element.href));
            break;
            case 'artist':
                searchData.forEach(element => UICtrl.createSearchResult(element.images[0].url, element.name, '', filter, element.href));
            break;
            case 'album':
                searchData.forEach(element => UICtrl.createSearchResult(element.images[0].url, element.name, element['release_date'].substring(0,4), filter, element.href));
            break;
        }
    });

    const showDetail = async (e) => {
        // get detail 
        const item = await APICtrl.getDetail(localStorage.getItem('access_token'), e.dataset.resultHref);
        // get type
        const type = e.dataset.type;

        console.log(item);

        // show detail page
        switch(type) {
            case 'track':
                // const info = 
                UICtrl.showDetailSection(item.album.images[0].url, item.name);
            break;
            case 'artist':
                UICtrl.showDetailSection(item.images[0].url, item.name);
            break;
            case 'album':
                UICtrl.showDetailSection(item.images[0].url, item.name);
                UICtrl.showAlbumInfo(item.label, item.release_date, item.total_tracks, item.tracks.items, item.artists[0].name);
            break;
        }
    }

    return {
        init() {
            console.log('App is starting');
            startApp();
        },

        showDetail(e){
            showDetail(e)   
        }
    }
    
})(UIController, APIController);

// load
APPController.init();