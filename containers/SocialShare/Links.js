import React, { Component } from 'react';
import {
  FacebookShareCount,
  PinterestShareCount,
  VKShareCount,
  OKShareCount,
  RedditShareCount,
  TumblrShareCount,

  FacebookShareButton,
  LinkedinShareButton,
  TwitterShareButton,
  PinterestShareButton,
  VKShareButton,
  OKShareButton,
  TelegramShareButton,
  WhatsappShareButton,
  RedditShareButton,
  EmailShareButton,
  TumblrShareButton,
  LivejournalShareButton,
  MailruShareButton,
  ViberShareButton,
  WorkplaceShareButton,
  LineShareButton,
  WeiboShareButton,
  PocketShareButton,
  InstapaperShareButton,

  FacebookIcon,
  TwitterIcon,
  LinkedinIcon,
  PinterestIcon,
  VKIcon,
  OKIcon,
  TelegramIcon,
  WhatsappIcon,
  RedditIcon,
  TumblrIcon,
  MailruIcon,
  EmailIcon,
  LivejournalIcon,
  ViberIcon,
  WorkplaceIcon,
  LineIcon,
  PocketIcon,
  InstapaperIcon,
} from 'react-share';
import Translate from '../../components/Translate/Index';

const Links = (props) => {
    const shareUrl = props.url;
    const title = props.title;
    const media = props.media
    const emailTitle = props.emailTitle
    const emailBody = props.emailBody ? props.emailBody  : "Body"
    let round =  false
    if(props.countItems != "all"){
        //round = props.round == "true" ? true : false
    }
    const buttonHeightWidth = props.buttonHeightWidth ? parseInt(props.buttonHeightWidth) : 40
    return (
      
            props.countItems == "all" ?
                <div className="Share__container">
                    <div className="social-share">
                        <FacebookShareButton
                            url={shareUrl}
                            quote={title}
                            className="social-share__share-button">
                            <FacebookIcon
                            size={buttonHeightWidth}
                            round={round} />
                        </FacebookShareButton>

                        {/* <FacebookShareCount
                            url={shareUrl}
                            className="social-share__share-count">
                            {count => count}
                        </FacebookShareCount> */}
                    </div>

                    <div className="social-share">
                        <TwitterShareButton
                            url={shareUrl}
                            title={title}
                            className="social-share__share-button">
                            <TwitterIcon
                            size={buttonHeightWidth}
                            round={round} />
                        </TwitterShareButton>

                        <div className="social-share__share-count">
                            &nbsp;
                        </div>
                    </div>
                    <div className="social-share">
                        <WhatsappShareButton
                            url={shareUrl}
                            title={title}
                            separator=":: "
                            className="social-share__share-button">
                            <WhatsappIcon size={buttonHeightWidth} round={round} />
                        </WhatsappShareButton>

                        <div className="social-share__share-count">
                            &nbsp;
                        </div>
                    </div>
                    <div className="social-share">
                        <LinkedinShareButton
                            url={shareUrl}
                            windowWidth={750}
                            windowHeight={600}
                            className="social-share__share-button">
                            <LinkedinIcon
                            size={buttonHeightWidth}
                            round={round} />
                        </LinkedinShareButton>
                    </div>

                    <div className="social-share">
                        <PinterestShareButton
                            url={shareUrl}
                            media={`${media}`}
                            windowWidth={1000}
                            windowHeight={730}
                            className="social-share__share-button">
                            <PinterestIcon size={buttonHeightWidth} round={round} />
                        </PinterestShareButton>

                        {/* <PinterestShareCount url={shareUrl}
                            className="social-share__share-count" /> */}
                    </div>
                    <div className="social-share">
                        <TelegramShareButton
                            url={shareUrl}
                            title={title}
                            className="social-share__share-button">
                            <TelegramIcon size={buttonHeightWidth} round={round} />
                        </TelegramShareButton>

                        <div className="social-share__share-count">
                            &nbsp;
                        </div>
                    </div>

                    <div className="social-share">
                        <VKShareButton
                            url={shareUrl}
                            image={`${media}`}
                            windowWidth={660}
                            windowHeight={460}
                            className="social-share__share-button">
                            <VKIcon
                            size={buttonHeightWidth}
                            round={round} />
                        </VKShareButton>

                        {/* <VKShareCount url={shareUrl}
                            className="social-share__share-count" /> */}
                    </div>

                    <div className="social-share">
                        <OKShareButton
                            url={shareUrl}
                            image={`${media}`}
                            className="social-share__share-button">
                            <OKIcon
                            size={buttonHeightWidth}
                            round={round} />
                        </OKShareButton>

                        {/* <OKShareCount url={shareUrl}
                            className="social-share__share-count" />*/}
                    </div> 

                    <div className="social-share">
                    <RedditShareButton
                        url={shareUrl}
                        title={title}
                        windowWidth={660}
                        windowHeight={460}
                        className="social-share__share-button">
                        <RedditIcon
                        size={buttonHeightWidth}
                        round={round} />
                    </RedditShareButton>

                    {/* <RedditShareCount url={shareUrl}
                        className="social-share__share-count" /> */}
                    </div>

                    <div className="social-share">
                        <TumblrShareButton
                            url={shareUrl}
                            title={title}
                            windowWidth={660}
                            windowHeight={460}
                            className="social-share__share-button">
                            <TumblrIcon
                            size={buttonHeightWidth}
                            round={round} />
                        </TumblrShareButton>

                    {/* <TumblrShareCount url={shareUrl}
                        className="social-share__share-count" /> */}
                    </div>

                    <div className="social-share">
                        <LivejournalShareButton
                            url={shareUrl}
                            title={title}
                            description={shareUrl}
                            className="social-share__share-button"
                        >
                            <LivejournalIcon size={buttonHeightWidth} round={round} />
                        </LivejournalShareButton>
                    </div>

                    <div className="social-share">
                        <MailruShareButton
                            url={shareUrl}
                            title={title}
                            className="social-share__share-button">
                            <MailruIcon
                            size={buttonHeightWidth}
                            round={round} />
                        </MailruShareButton>
                    </div>

                    <div className="social-share">
                        <EmailShareButton
                            url={shareUrl}
                            subject={emailTitle}
                            body={emailBody}
                            className="social-share__share-button">
                            <EmailIcon
                            size={buttonHeightWidth}
                            round={round} />
                        </EmailShareButton>
                    </div>
                    <div className="social-share">
                        <ViberShareButton
                            url={shareUrl}
                            title={title}
                            className="social-share__share-button">
                            <ViberIcon
                            size={buttonHeightWidth}
                            round={round} />
                        </ViberShareButton>
                    </div>

                    <div className="social-share">
                        <WorkplaceShareButton
                            url={shareUrl}
                            quote={title}
                            className="social-share__share-button">
                            <WorkplaceIcon
                            size={buttonHeightWidth}
                            round={round} />
                        </WorkplaceShareButton>
                    </div>

                    <div className="social-share">
                        <LineShareButton
                            url={shareUrl}
                            title={title}
                            className="social-share__share-button">
                            <LineIcon
                            size={buttonHeightWidth}
                            round={round} />
                        </LineShareButton>
                    </div>

                    {/* <div className="social-share">
                        <WeiboShareButton
                            url={shareUrl}
                            title={title}
                            image={`${media}`}
                            className="social-share__share-button">
                            <img className="social-share__custom-icon" src="http://icons.iconarchive.com/icons/martz90/circle-addon2/512/weibo-icon.png" alt="Weibo share button" />
                        </WeiboShareButton>
                    </div> */}

                    <div className="social-share">
                        <PocketShareButton
                            url={shareUrl}
                            title={title}
                            className="social-share__share-button">
                            <PocketIcon
                            size={buttonHeightWidth}
                            round={round} />
                        </PocketShareButton>
                    </div>

                    <div className="social-share">
                        <InstapaperShareButton
                            url={shareUrl}
                            title={title}
                            className="social-share__share-button">
                            <InstapaperIcon
                            size={buttonHeightWidth}
                            round={round} />
                        </InstapaperShareButton>
                    </div>
                </div>
            : 
            <li className={props.className ? props.className : null}>
                <a className="videoListBtns" href="#" title={Translate(props, "Share")}  onClick={props.openPopup}>
                    <span className="material-icons md-18">
                        share
                    </span>
                    {
                        !props.hideTitle ? 
                            Translate(props,'Share')
                    : null
                    }
                </a>
            </li>
    );
}

export default Links;