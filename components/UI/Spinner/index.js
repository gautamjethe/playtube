import React from 'react';


const spinner = () => (
    //types
    /*
        ~ uploading
        ~ create
        ~ edit
        ~ delete
        ~ accept
        ~ reject
    */
    <div className="loading_overlay">
        <div className="Loader">
            <div></div>
            <div></div>
            <div></div>
            <div></div>
        </div>
    </div>
);

export default spinner;