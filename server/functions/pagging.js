
exports.create = (req,totalCount,currentPage = 1,pageUri = "/",perPage=10,customParam = "") => {
    if(totalCount <= perPage){
        return ""
    }
    this.perPage = perPage;
    this.totalCount =parseInt(totalCount);
    this.currentPage = parseInt(currentPage);
    this.previousPage = this.currentPage - 1;
    this.nextPage = this.currentPage + 1;
    this.pageCount = Math.ceil(this.totalCount / this.perPage);
    this.pageUri = pageUri;
    this.offset  = this.currentPage > 1 ? this.previousPage * this.perPage : 0;
    this.sidePages = 5;
    this.pages = false;
    let url  = req.protocol + '://' + req.get('host') + req.originalUrl
    let queryString = ""
    if(url.indexOf('?') > -1){
        const dataUrl = url.split('?')
        queryString = "?"+dataUrl[1]
        url = dataUrl[0]
    }
   
    const subString = url.toString().charAt(url.toString().length - 1)
    if(parseInt(subString) === parseInt(subString, 10)){
        url = url.toString().substr(0, url.toString().lastIndexOf("/"))
    }
    if(customParam){
        url = url.toString().substr(0, url.toString().lastIndexOf("/"))
    }
    //check last character
    const lastString = url.toString().charAt(url.toString().length - 1)
    if(lastString != "/"){
        url = url + "/"
    }
    this.pageUri = url+customParam

    this.pages='<ul class="pagination pagination-md">';

    if(this.currentPage - this.sidePages > 1)
        this.pages+='<li class="page-item"><a class="page-link" href="'+this.pageUri + '1'+queryString+'">First</a></li>';


    if(this.previousPage > 0)
        this.pages+='<li class="page-item"><a class="page-link" id="previous-page" href="'+this.pageUri + this.previousPage+queryString+'">Previous</a></li>';


        /*Add back links*/
        if(this.currentPage > 1){
            for (var x = this.currentPage - this.sidePages; x < this.currentPage; x++) {
                if(x > 0)
                    this.pages +='<li class="page-item"><a class="page-link" href="'+this.pageUri+x+queryString+'">'+x+'</a></li>';
            }
        }

        /*Show current page*/
        this.pages +='<li class="page-item active"><a class="page-link" href="'+this.pageUri+this.currentPage+queryString+'">'+this.currentPage+'</a></li>';

        /*Add more links*/
        for(x = this.nextPage; x <= this.pageCount; x++){

            this.pages +='<li class="page-item"><a class="page-link" href="'+this.pageUri+x+queryString+'">'+x+' </a></li>';

            if(x >= this.currentPage + this.sidePages)
                break;
        }


        /*Display next buttton navigation*/
        if(this.currentPage + 1 <= this.pageCount)
            this.pages+='<li class="page-item"><a class="page-link" id="next-page" href="'+this.pageUri+this.nextPage+queryString+'">Next</a></li>';

        if(this.pageCount > x)
            this.pages+='<li class="page-item"><a class="page-link" href="'+this.pageUri + this.pageCount+queryString+ '">Last</a></li>';
        
        this.pages+='</ul>';

    return this.pages;
}