import React from "react"

const Language = (props) => {
    
    return (
        <React.Fragment>
            <li className="nav-item dropdown">
                <a className="nav-link" href="#" id="navbarDropdown"
                    role="button" data-toggle="dropdown" aria-haspopup="true"
                    aria-expanded="false">
                    <span className="flag-icon flag-icon-eg"> </span>  English
                </a>
                <ul className="dropdown-menu dropdown-menu-right iconMenuList" aria-labelledby="navbarDropdown">
                    <span className="dropdown-menu-arrow"></span>
                    {
                        props.pageInfoData.languages.map(language => {
                            return (
                                <li>
                                    <a className="dropdown-item iconmenu" href="#">
                                        <span className={`flag-icon${language.class}`}>
                                        </span>{`${language.title}`}
                                    </a>
                                </li>
                            )
                        })
                    }

                </ul>
            </li>
        </React.Fragment>
    )
}

export default Language