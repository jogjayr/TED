//useful functions
var Utils = {
	fileSizeToHumanReadable: function (fileSize) {
		var one_kb = 1024;
		var one_mb = one_kb * 1024;
		var one_gb = one_mb * 1024;
		var one_tb = one_gb * 1024;
		if(typeof fileSize !== 'number') fileSize = parseFloat(fileSize);
		if(isNaN(fileSize)) throw new Error('Not a number'); 
		else {
			if(fileSize < one_kb) return fileSize + 'bytes';
			else if(fileSize >= one_kb && fileSize < one_mb) return (fileSize / one_kb).toFixed(1).toString() + ' kb';
			else if(fileSize >= one_mb && fileSize < one_gb) return (fileSize / one_mb).toFixed(1).toString() + ' mb';
			else if(fileSize >= one_gb && fileSize < one_tb) return (fileSize / one_gb).toFixed(1).toString() + ' gb';
		}
	},
	dateToHumanReadable: function (date) {
	 	var date_obj = new Date(date);
	 	var months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
		if(date_obj.toString !== 'Invalid Date') {
			return date_obj.getDate().toString() + " " + months[date_obj.getMonth()] + ", " + date_obj.getFullYear().toString();
		}
		return '';
	}
}

