import React from "react"

import Link from "../../components/Link/index"

const Image = (props) => {
    let isS3 = true
    
    return (
        props.noRedirect ?
            <a onClick={(e) => {
                e.preventDefault()
              }}>
                <img src={(isS3 ? props.imageSuffix : "")+props.data.avtar} alt={`${props.data.displayname}`} />
            </a>
        :
        <Link href={`/${props.data.username}`}>
            <a>
                <img src={(isS3 ? props.imageSuffix : "")+props.data.avtar} alt={`${props.data.displayname}`} />
            </a>
        </Link>
    )

}

export default Image