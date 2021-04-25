import React, {Component} from "react";

class Tags extends Component {
    constructor(props) {
      super(props);
      this.state = {
        tags: [
          
        ]
      };
    }
    static getDerivedStateFromProps(nextProps, prevState) {
      if(prevState.localUpdate){
        return {...prevState,localUpdate:false}
      }else if(nextProps.tags != prevState.tag && nextProps.tags){
        this.setState({tags:nextProps.tags});
      }
    }
    
    removeTag = (i) => {
      const newTags = [ ...this.state.tags ];
      newTags.splice(i, 1);
      this.setState({localUpdate:true, tags: newTags });
      this.props.changeTags(newTags);
    }
  
    inputKeyDown = (e) => {
      
      const val = e.target.value;
      if (e.key === 'Enter' && val) {
        if (this.state.tags.find(tag => tag.toLowerCase() === val.toLowerCase())) {
          e.preventDefault();
          return;
        }
        this.setState({localUpdate:true, tags: [...this.state.tags, val]});
        this.props.changeTags([...this.state.tags, val]);
        this.tagInput.value = null;
        e.preventDefault();
      } else if (e.key === 'Backspace' && !val) {
        this.removeTag(this.state.tags.length - 1);
      }else if(e.key === 'Enter'){
        e.preventDefault();
      }
    }
  
    render() {
      const { tags } = this.state;
  
      return (
        <div className="input-tag">
          <ul className="input-tag__tags">
            { tags.map((tag, i) => (
              <li key={tag}>
                {tag}
                <button type="button" onClick={() => { this.removeTag(i); }}>+</button>
              </li>
            ))}
            <li className="input-tag__tags__input">
                <input placeholder={this.props.t("Tags")} type="text" onKeyDown={this.inputKeyDown} ref={c => { this.tagInput = c; }} />
            </li>
          </ul>
        </div>
      );
    }
  }

  export default Tags;