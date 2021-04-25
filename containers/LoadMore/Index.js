import React from "react"

const loadMore = (props) => {

    return (
        <div className={`loadmoreBtn${props.className ? " "+props.className : ""}`}  onClick={props.loadMoreContent}>
            {
                !props.loading ?
                    <button className="btnLoadMore">
                        <span id="text">{props.t("Load More")}</span> 
                        <span className="material-icons">arrow_drop_down_circle</span>
                    </button>
                :
                <div className={`loader${props.loaderclassName ? " "+props.loaderclassName : ""}`}>
                    <div className="duo duo1">
                        <div className="dot dot-a"></div>
                        <div className="dot dot-b"></div>
                    </div>
                    <div className="duo duo2">
                        <div className="dot dot-a"></div>
                        <div className="dot dot-b"></div>
                    </div>
                </div>
                    // <img src="/static/images/loader.gif" alt="" style={{width: "50px"}} />
            }
        </div>
    )

}

export default loadMore