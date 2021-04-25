const general = {
    DATABSE: "unexpected error, please try again later",
    GENERAL:"unexpected error, please try again later",
    PARAMMISSING:"Required Parameter missing.",
    INVALIDREQUEST:"Invalid Request",
    LOGIN: "Please login to continue",
    PERMISSION_ERROR: "Unauthoried content access.",
    USERNOTVERIFIED:"You have not verified your Account yet, please check your email and verify it.",
    USERNOTBYADMINVERIFIED: "Your Account is not verified by Admin yet.",
    WALLETRECHARGE:"Recharge Wallet",
    CONTACTSUCCESS:"Thank you for contacting us!",
    GENERALSAVED:"Data saved successfully."
}
const ads = {
    DELETED:"Ad deleted successfully",
    EDIT:"Ad edited successfully.", 
    SUCCESS:"Ad create successfully.",
    LIMITERRROR:"Your allowed upload limit reached, upgrade your subscription plan or delete old advertisement.",
}
const auth = {
    INVALID_CREDENTIALS: "Please enter valid Email ID or Username/Password.",
    VALID_EMAIL:"Please enter valid email",
    VALID_PASSWORD:"Please enter valid password",
    NO_EMAIL_FOUND:"A user account with that email was not found.",
    EMAILVERIFY:"This account still requires either email verification or admin approval.",
    ADMINAPPROVAL:"This account still requires admin approval.",
    RESENDEMAILVERIFY:"Verification email sent successfully, please check your email and follow the instructions."
}

const video = {
    LIMITERRROR:"Your allowed upload limit reached, upgrade your subscription plan or delete old videos.",
    SUCCESS:"Video create successfully.",
    EDIT:"Video edited successfully.",
    DELETED:"Video deleted successfully",
    QUOTAREACHED:"You have reached your upload quota limit. Please delete your previous uploaded videos or upgrade your membership.",
    WITHDRAWREQERROR:"Withdraw request amount must be less than or equal to thresold amount",
    WITHDRAWREQDELETE:"Withdraw request deleted successfully.",
    WITHDRAWREQPREVIOUSERROR:"Previous request does not process yet, so please wait.",
    liveStreaming:"You have reached your Live Streaming create limit. Please upgrade your membership.",
    LIVESTREAMINGSAVINGERROR:"Error in saving your Live Streaming.",
    LIVESTREAMINGSTOPPINGERROR:"Error in stopping your Live Streaming.",
}


const movie = {
    LIMITERRROR:"Your allowed upload limit reached, upgrade your subscription plan or delete old movies.",
    SUCCESS:"Movie create successfully.",
    EDIT:"Movie edited successfully.",
    DELETED:"Movie deleted successfully",
    QUOTAREACHED:"You have reached your upload quota limit. Please delete your previous uploaded movies or upgrade your membership.",
    DELETEDITEM:"Item deleted successfully.",
    EPISODENUMBER:"Episode Number Field is mandatory.",
    RELEASEDATE:"Release Date Field is mandatory.",
    EPISODEEDIT:"Episode edited successfully.",
    EPISODESUCCESS:"Episode create successfully.",
    MEMBERSELECTERROR:"Select member from drop down list.",
    CHARRACTERERROR:"Character Field is mandatory.",
    PHOTOUPLOADED:"Photo uploaded successfully.",
    CASTCREATED:"Cast member added successfully.",
    CASTEDITED:"Cast member edited successfully.",
    
    CREWCREATED:"Crew member added successfully.",
    CREWEDITED:"Crew member edited successfully.",
    ENTRYEXISTS:"Entry already exists."
}

const channel = {
    VIDEODELETED:"Video Deleted from Channel successfully.",
    PLAYLISTDELETED:"Playlist Deleted from Channel successfully.",
    COVERUPLOADED:"Cover Photo Added to Channel successfully.",
    COVERREPOSITION:"Channel Cover Photo Reposition successfully.",
    MAINPHOTOUPLOADED:"Main Photo Added to Channel successfully.",
    PLAYLISTADDED:"Playlists Added to Channel successfully.",
    VIDEOADDED:"Videos Added to Channel successfully.",
    VIDEONOTIFYEDADDED:"Videos Added to Channel successfully, it will appear once it finished processing.",
    SUCCESS:"Channel created successfully.",
    DELETED:"Channel deleted successfully",
    EDIT:"Channel edited successfully.",
    QUOTAREACHED:"You have reached your upload quota limit. Please delete your previous uploaded channels or upgrade your membership.",
    POSTCREATED:"Post created successfully.",
    POSTEDITED:"Post edited successfully.",
    POSTDELETED:"Post deleted successfully",
    
}
const member = {
    COVERREPOSITION:"Profile Cover Photo Reposition successfully.",
    COVERUPLOADED:"Cover Photo Added to Profile successfully.",
    MAINPHOTOUPLOADED:"Main Photo Added to Profile successfully.",
    EDIT:"Profile edited successfully.",
    USERNAMETAKEN:"Username already taken, choose different username.",
    EMAILTAKEN:"EMAIL already taken, choose different email.",
    PROFILEUPDATED:"Profile updated successfully.",
    INVALIDEMAIL:"Please enter valid Email ID.",
    PASSWORDNOTMATCH:"Old Password did not match",
    PASSWORDINVALID:"Invalid Password.",
    PASSWORDCHANGED:"Password changed successfully.",
    VERIFICATIONREQUESTSEND:"Verification Request send successfully.",
    VERIFICATIONREQUESTALREADYSEND:"Verification Request already send, please wait for the request to complete.",
    UPLOADVERIFICATIONIMAGE:"Upload Verification Image.",
    VERIFICATIONALREADYFDONE:"Your Profile is already verified.",
    DELETED:"Member Account Deleted Successfully.",
    MONETIZATIONREQUEST:"Monetization setting saved successfully.",
    MONETIZATIONREQUESTSEND:"Monetization Request send successfully.",
    MONETIZATIONREQUESTALREADYSEND:"Monetization Request already send, please wait for the request to complete.",
    NEWSLETTERSUCCESS:"Thanks for subscribing our newsletter.",
    INVALIDPAYPALEMAIL:"Please enter valid Paypal Email ID."
}
const playlist = {
    DELETED:"Playlist deleted successfully",
    SUCCESS:"Playlist created successfully.",
    EDIT:"Playlist edited successfully.",
    VIDEOSUCCESS:"Video added to playlist successfully",
    QUOTAREACHED:"You have reached your upload quota limit. Please delete your previous created playlist or upgrade your membership."
}
const audio = {
    DELETED:"Audio deleted successfully",
    SUCCESS:"Audio created successfully.",
    EDIT:"Audio edited successfully.",
    QUOTAREACHED:"You have reached your upload quota limit. Please delete your previous created audio or upgrade your membership."
}
const blog = {
    SUCCESS:"Blog created successfully.",
    DELETED:"Blog deleted successfully",
    EDIT:"Blog edited successfully.",
    QUOTAREACHED:"You have reached your upload quota limit. Please delete your previous created blogs or upgrade your membership."
}
const error = {
    TITLEMESSAGE: "Title should not be empty!",
    DESCRIPTIONMESSAGE:"Description should not be empty",
    PASSWORDERROR:'Password Field is mandatory.'
}
const report = {
    SUCCESS:"Report submitted successfully, we will soon take appropriate action against the reported content."
}
module.exports = {
    audio:audio,
    auth:auth,
    movie:movie,
    report:report,
    blog:blog,
    playlist:playlist,
    channel:channel,
    error:error,
    video:video,
    general:general,
    member:member,
    ads:ads
}