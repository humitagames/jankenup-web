class LazyLoad{
    
    constructor(){

        // Observador de mutaciones
        this.mutationObserver = new MutationObserver( ( list, observer ) => {
            
            // Comprobar si elemento insertado o algun nodo de su jerarquía fue configurado para lazyload
            for( const l of list ){
                
                for( const n of l.addedNodes ){
                    
                    if( n instanceof HTMLElement ){
                        
                        const filter = Array.from( n.querySelectorAll( "[data-lazy]" ) );
                        if( n.dataset.lazy ) filter.unshift( n );

                        // Añadir c/e que coincida al observaodr
                        for( const f of filter ){
                            f.appended = true;
                            this.intersectionObserver.observe( f );
                        }
                        
                    }
                    
                }
                
            }
            
        });
        
        // Observador de intersección
        this.intersectionObserver = new IntersectionObserver( ( entries, observer ) => {
                    
            for( const entry of entries ){

                if( entry.isIntersecting ) {
                    
                    let element = entry.target;
                    
                    this.preload( element.dataset.url, element, element.dataset.lazy_type )
                    
                    this.intersectionObserver.unobserve( element );

                }

            };

        });
        
        this.mutationObserver.observe( document,  { childList: true, subtree: true } );
        
    }
    
    /* Añadir items para que, una vez sean insertados al DOM, comience la carga */
    observe( url, element, type, onload ){
        
        if( !( element instanceof HTMLElement ) ) return;
        
        // Agregar evento para elemento si se envía función
        if( onload && typeof onload == "function" ){
            element.addEventListener( "lazyLoad", loaded => { onload( loaded ); } );
        }
        
        if( this.preloadedImages && this.preloadedImages[ url ] ){
            this.preload( url, element, type );
        }
        else{
            element.setAttribute( 'data-lazy-load', true );
        
            // Añadir data al elemento
            element.dataset.lazy = true;
            element.dataset.url = url;
            element.dataset.lazy_type = type;
            
            // Si ya fue añadido y se necesita cambiar la imagen, observar otra vez
            if( element.appended || element.appended === undefined ){
                this.intersectionObserver.observe( element );
            }
            
        }
        
    }
    
    preload( url, element, type ){

        if( !url ) return;
        
        if( !this.preloadedImages ) this.preloadedImages = [];
        
        if( this.preloadedImages[ url ] ){
            
            switch( this.preloadedImages[ url ].status ){
                case "ready":
                    
                    element.dataset.url = url;
                    this.setImage( this.preloadedImages[ url ].image, element, type );
                    
                    break;
                    
                case "failed":
                    
                    if( element && element instanceof HTMLElement && type ){
                        this.removeImage( element, type );
                    }
                    
                    break;
                    
                case "loading":
                    if( element && element instanceof HTMLElement && type ){
                        this.preloadedImages[ url ].listeners.push( [ element, type ] );
                    }
                    break;
            }
            
        }
        else{
            
            this.preloadedImages[ url ] = { status: "loading", listeners: [] };
            
            if( element && element instanceof HTMLElement && type ){
                this.preloadedImages[ url ].listeners.push( [ element, type ] );
            }
                
            this.preloadedImages[ url ].image = ( src => {

                const image = new Image();      
                image.src= src;

                image.onload = _ => {

                    this.preloadedImages[ url ].status = "ready";

                    for( const [ e, t ] of this.preloadedImages[ url ].listeners ){
                        this.setImage( this.preloadedImages[ url ].image, e, t );
                    } 

                };
                
                image.onerror = _ => {
                    
                    this.preloadedImages[ url ].status = "failed";

                    for( const [ e, t ] of this.preloadedImages[ url ].listeners ){
                        this.removeImage( e, t );
                    }
                    
                };

                return image;

            })( url );
            
        }
        
    }
    
    setImage( image, element, type ){
        
        if( !image || !element || !( element instanceof HTMLElement ) || !type ) return;
        
        switch( type ){
                
            case "img":
                element.setAttribute( "src", image.getAttribute( "src" ) );
                break;
            case "background":
                element.style.backgroundImage = `url(${image.getAttribute( "src" )})`;
                break;
                
        }
        
        // Despachar evento ligado a la carga de la imagen
        element.dispatchEvent( new CustomEvent( "lazyLoad", { load: true } ) );
        
        element.dataset.url = image.getAttribute( "src" );
        
        element.removeAttribute( 'data-lazy-load' );
        element.removeAttribute( 'data-lazy');
        element.removeAttribute( 'data-lazy_type');
        
    }
    
    removeImage( element, type ){
        
        if( !element || !( element instanceof HTMLElement ) || !type ) return;
        
        switch( type ){
                
            case "img":
                element.removeAttribute( "src" );
                break;
            case "background":
                element.style.backgroundImage = 'none';
                break;
                
        }
        
        element.removeAttribute( 'data-lazy-load' );
        element.removeAttribute( 'data-url' );
        element.removeAttribute( 'data-lazy');
        element.removeAttribute( 'data-lazy_type');
        
    }   
}