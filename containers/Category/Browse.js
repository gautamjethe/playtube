import React from "react"
import { connect } from "react-redux";
import Category from "./Category"

import asyncComponent from '../../hoc/asyncComponent/asyncComponent';
const Blog = asyncComponent(() => {
    return import('../Blog/CarouselBlogs');
});
 
const Video = asyncComponent(() => {
    return import('../HomePage/TopVideos');
});
import Translate from "../../components/Translate/Index"

const Channel = asyncComponent(() => {
    return import('../Channel/CarouselChannel');
});
class Browse extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            type: props.pageInfoData.type,
            items: props.pageInfoData.items,
            categories: props.pageInfoData.category
        }
    }
    
    static getDerivedStateFromProps(nextProps, prevState) {
        if(typeof window == "undefined" || nextProps.i18n.language != $("html").attr("lang")){
            return null;
        }
        if(prevState.localUpdate){
            return {...prevState,localUpdate:false}
        } else if (nextProps.pageInfoData.type && nextProps.pageInfoData.type != prevState.type) {
            return { type: nextProps.pageInfoData.type,items:nextProps.pageInfoData.items,categories:nextProps.pageInfoData.category }
        } else{
            return null
        }
    }
    
    getItemIndex(item_id) {
        const items = [...this.state.items];

        const itemIndex = items.findIndex(p => p[this.state.type + "_id"] == item_id);
        return itemIndex;
    }


    render() {
        let contents = null
        if (this.state.items && this.state.items.length) {
            if (this.state.type == "video") { 
                contents = <React.Fragment>
                            <div className="container"><div className="row"><div className="col-sm-12"><hr className="horline" /></div></div></div>
                            <Video  {...this.props} title={Translate(this.props,"Popular Videos")} videos={this.state.items} />
                          </React.Fragment>
            } else if (this.state.type == "channel") {
                contents = <React.Fragment>
                                <div className="container"><div className="row"><div className="col-sm-12"><hr className="horline" /></div></div></div>
                                <Channel {...this.props} title={Translate(this.props,"Popular Channels")} channels={this.state.items} />
                            </React.Fragment>
            } else if (this.state.type == "blog") {
                contents = <React.Fragment>
                                <div className="container"><div className="row"><div className="col-sm-12"><hr className="horline" /></div></div></div>
                                <Blog {...this.props}  title={Translate(this.props,"Popular Blogs")} blogs={this.state.items} />
                            </React.Fragment>
            }
        }
        return (
            <React.Fragment>
                    <div className="category-grid-wrap top30p">
                        <div className="container">
                            <div className="row mob2col">
                                {
                                    this.state.categories.map(cat => {
                                        return (
                                                <Category  key={cat.category_id} key={cat.category_id} {...this.props} type={this.state.type} category={cat} />
                                        )
                                    })
                                }
                            </div>
                        </div>
                        <React.Fragment>
                            {contents}
                        </React.Fragment>
                    </div>
            </React.Fragment>
        )
    }
}


const mapStateToProps = state => {
    return {
        pageInfoData: state.general.pageInfoData
    };
};

export default connect(mapStateToProps, null)(Browse)