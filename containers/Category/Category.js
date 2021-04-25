import React from "react"
import Image from "../Image/Index"
import ShortNumber from "short-number"
import Link from "../../components/Link/index"
import CensorWord from "../CensoredWords/Index"
import { renderToString } from 'react-dom/server'
const Category = (props) => {
    return (
        <div className="col-lg-3 col-md-3 col-sm-4 ">
            <div className="categoryBox">
                <Link href={`/category`} customParam={`type=${props.type}&categoryId=` + props.category.slug} as={`/${props.type}/category/` + props.category.slug}>
                    <a>
                        <div className="categoryBoxContent">
                            <Image className="categoryBoxImg" imageSuffix={props.pageInfoData.imageSuffix} image={props.category.image} title={renderToString(<CensorWord {...props} text={props.t(props.category.title)} />)} />
                            <div className="overlay">
                                <div className="categoryBoxText">
                                    {
                                        props.category.icon ?
                                    <Image imageSuffix={props.pageInfoData.imageSuffix} image={props.category.icon} title={renderToString(<CensorWord {...props} text={<CensorWord {...props} text={props.t(props.category.title)} />} />)} />
                                            : null
                                    }
                                    <p className="catname">{<CensorWord {...props} text={props.t(props.category.title)} />}</p>
                                    <p className="totlblg">{`${ShortNumber(props.category.item_count)}`}{" "}{props.t(props.type + "_count", { count: props.category.item_count })}</p>
                                </div>
                            </div>
                        </div>
                    </a>
                </Link>
            </div>
        </div>
    )
}

export default Category