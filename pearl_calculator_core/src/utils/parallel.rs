#[cfg(feature = "enable-rayon")]
pub use rayon::prelude::*;

#[cfg(not(feature = "enable-rayon"))]
pub mod prelude {
    pub trait IntoParallelIterator {
        type Item;
        type IntoIter: Iterator<Item = Self::Item>;
        fn into_par_iter(self) -> Self::IntoIter;
    }

    impl<I: IntoIterator> IntoParallelIterator for I {
        type Item = I::Item;
        type IntoIter = I::IntoIter;
        fn into_par_iter(self) -> Self::IntoIter {
            self.into_iter()
        }
    }

    pub trait ParallelIterator: Iterator {}
    impl<I: Iterator> ParallelIterator for I {}

    // Helper shim for par_iter() on slices/vecs if needed,
    // but code uses into_par_iter(), so generic impl covers it.
    // If the code uses .par_iter(), we might need another trait.
}

#[cfg(not(feature = "enable-rayon"))]
pub use prelude::*;
