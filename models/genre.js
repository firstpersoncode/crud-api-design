const mongoose = require('mongoose');

// Genre Schema
const genreSchema = mongoose.Schema({
	name:{
		type: String,
		required: true
	},
	create_date:{
		type: Date,
		default: Date.now
	}
});

const Genre = mongoose.model('Genre', genreSchema);

// Get Genres
module.exports.getGenres = (callback) => {
	Genre.find(callback);
}

// Add Genre
module.exports.addGenre = (genre, callback) => {
	var newGenre = new Genre({
		name: genre.genre
	});
	newGenre.save().then((newGenre) => {
		callback(newGenre);
	});
}

// Update Genre
module.exports.updateGenre = (id, genre, options, callback) => {
	var query = {_id: id};
	var update = {
		name: genre.genre
	}
	Genre.findOneAndUpdate(query, update, options, callback);
}


// Delete Genre
module.exports.removeGenre = (id, callback) => {
	var query = {_id: id};
	Genre.remove(query, callback);
}
