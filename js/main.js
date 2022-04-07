if ('serviceWorker' in navigator) {
    window.addEventListener('load', function() {
        navigator.serviceWorker.register('/service-worker.js');
    });
}

function useFilter(el){
    const allFilters = Array.from(document.querySelector('#filter').children);
    allFilters.forEach( el => el.classList.remove('filter-type--active', 'filter-type--clicked'));
    el.classList.add('filter-type--active', 'filter-type--clicked');
    document.getElementById('search-song').dispatchEvent(new KeyboardEvent('keyup', {'key':''}))
}