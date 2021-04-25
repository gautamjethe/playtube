import React from "react"
import Image from "../Image/Index"
import Link from "../Header/Links"
import Translate from "../../components/Translate/Index"


const Header = (props) => {
  
    let data = {}
     data = {...props.item}
     data.type = props.type

    let title = props.title
    if (title.length > 300) {
      title = title.substring(0, 300);
    } 
    return (
        <React.Fragment>
            <h2 className="TopHeading">{Translate(props,"Show comments for:")}</h2>
              <div className="commentShow">
                <div className="commentNameImgWrap">
                      <Link data={data} className="commentNameImgWrap">
                        <Image imageSuffix={props.pageData.imageSuffix} image={props.image} title={props.title} />
                        <span style={{whiteSpace:"pre-line"}} dangerouslySetInnerHTML={{__html:props.linkify(title)}}></span>
                      </Link>
                </div>
              </div>
        </React.Fragment>
    )
}

export default Header 