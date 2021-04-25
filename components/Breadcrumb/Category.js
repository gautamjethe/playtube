import React from "react"

const Breadcrum = (props) => {

    let isS3 = true
    if (props.image) {
        const splitVal = props.image.split('/')
        if (splitVal[1] == "resources") {
            isS3 = false
        }
    } else {
        return null
    }
    const image = (isS3 ? props.pageInfoData.imageSuffix : "") + props.image
    let catData = null
    if (props.subcategories && props.subcategories.length > 0) {
        catData = <div className="op-back">
            <p>Sub Categories</p>
            <select onChange={props.onChange.bind(this)}>
                <option></option>
                {
                    props.subcategories.map(cat => {
                        return <option key={cat.category_id} value={cat.slug}>{props.t(cat.title)}</option>
                    })
                }

            </select>
        </div>
    } else if (props.subsubcategories && props.subsubcategories.length > 0) {
        catData = <div className="op-back">
            <p>{props.t("Sub Sub Categories")}</p>
            <select onChange={props.onChange.bind(this)}>
                <option></option>
                {
                    props.subsubcategories.map(cat => {
                        return <option key={cat.category_id} value={cat.slug}>{props.t(cat.title)}</option>
                    })
                }
            </select>
        </div>
    }

    return (
        <div className="breadCrumbWrap">
            <div className="breadCrumbContent">
                <div className="breadCrumbBg" style={{ backgroundImage: `url(${image})` }}> </div>

                <div className="overLay">
                    <div className="breadCrumbText">
                   
                   <div className="titleBradcrumb">{props.t(props.title)}</div> 
                   <div className="BradcrumbSubcat">{catData}</div> 

                    </div>

                </div>

            </div>
            
            
        </div>

    )
}

export default Breadcrum