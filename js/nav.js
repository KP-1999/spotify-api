function navigate(el){
    const allNavItems = document.getElementById('nav').children;

    for (let i of allNavItems) {
        i.classList.remove('nav-item--active');
        document.getElementById(i.dataset.sectionId).classList.remove('page-section--active');

        switch(i.id) {
            case "nav-search":
                i.querySelector('.icon').src = 'assets/img/menu-search.svg';
                break;
            case "nav-releases":
                i.querySelector('.icon').src = 'assets/img/menu-releases.svg';
                break
            default:
                i.querySelector('.icon').src = 'assets/img/menu-home.svg';
                break;
        }
    }
    
    switch(el.id) {
        case "nav-search":
            el.classList.add('nav-item--active');
            el.querySelector('.icon').src = 'assets/img/menu-search-filled.svg';
            document.getElementById(el.dataset.sectionId).classList.add('page-section--active');
            break;
        case "nav-releases":
            el.classList.add('nav-item--active');
            el.querySelector('.icon').src = 'assets/img/menu-releases-filled.svg';
            document.getElementById(el.dataset.sectionId).classList.add('page-section--active');
            break;
        default:
            el.classList.add('nav-item--active');
            el.querySelector('.icon').src = 'assets/img/menu-home-filled.svg';
            document.getElementById(el.dataset.sectionId).classList.add('page-section--active');
            break;
    }

    document.getElementById('detailContainer').classList.remove('detail--show');
}

function navigateTop(el){
    const allNavItems = document.getElementById('navItems').children;
    const slider = document.querySelector('.nav-slider');

    for (let i of allNavItems) {
        i.classList.remove('nav-item--active');
        document.getElementById(i.dataset.topId).classList.remove('page-top--active');
        slider.style.width = `${i.clientWidth}px`;
        slider.style.left = `${i.offsetLeft}px`;
    }

    switch(el.dataset.topId) {
        case "top-artist":
            el.classList.add('nav-item--active');
            document.getElementById(el.dataset.topId).classList.add('page-top--active');
            slider.style.width = `${el.clientWidth}px`;
            slider.style.left = `${el.offsetLeft}px`;
            break;
        default:
            el.classList.add('nav-item--active');
            document.getElementById(el.dataset.topId).classList.add('page-top--active');
            slider.style.width = `${el.clientWidth}px`;
            slider.style.left = `${el.offsetLeft}px`;
            break;
    }
}